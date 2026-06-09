// ============================================================
// Grida Copilot — agent runtime (GRD-104, AD-Copilot-02)
// ============================================================
// Receives chat messages from the browser, verifies the caller's JWT,
// hands Gemini a role-filtered tool menu, runs the agent loop, and
// streams the answer back.
//
// Security model:
//   - Deployed WITH JWT verification (no --no-verify-jwt) — unlike the
//     public telegram-bot/create-suggestion functions.
//   - The Supabase client is built from the CALLER's Authorization
//     header → every tool query runs under the user's RLS. No
//     service-role anywhere in this function.
//   - The Gemini key lives only in this function's env, never in the
//     browser bundle.
//   - Abuse guard (AD-Copilot-04): stepCountIs(5) bounds the tool-call
//     loop, maxOutputTokens bounds the answer. Per-user rate limiting
//     is tracked debt for the Hardening phase.
// ============================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  convertToModelMessages,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "npm:ai@5";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google@2";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  filterByRole,
  type CopilotLocale,
  type CopilotRole,
  type ToolContext,
} from "../_shared/copilot-tools/index.ts";

const MODEL_ID = "gemini-2.5-flash";
const MAX_STEPS = 5;
const MAX_OUTPUT_TOKENS = 1024;

const ALLOWED_ORIGINS = [
  "https://app.grida.space",
  "http://localhost:5173", // pnpm dev
  "http://localhost:4173", // pnpm preview (prod-build testing, project rule)
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    // The client reads the (possibly just-created) thread id off the
    // streaming response (GRD-124).
    "Access-Control-Expose-Headers": "x-thread-id",
  };
}

function jsonResponse(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

interface CopilotPayload {
  messages: UIMessage[];
  shipmentId?: string;
  locale?: string;
  threadId?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function textOf(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

// Thread title = first user message, whitespace-collapsed, ~40 chars
// (PRD v2 Open Question v2-3: model-generated titles deferred).
function threadTitle(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > 40 ? collapsed.slice(0, 40).trimEnd() + "…" : collapsed;
}

function buildSystemPrompt(locale: CopilotLocale, shipmentId?: string) {
  const language = locale === "ru" ? "Russian" : "English";
  const shipmentContext = shipmentId
    ? `The user is currently viewing shipment ${shipmentId}. ` +
      `Pass this id to tools unless the user explicitly names another shipment.`
    : `The user is NOT viewing any shipment right now. If they ask about ` +
      `orders, walls, or progress, politely ask them to open a shipment first.`;

  return [
    "You are Mira, the in-app assistant of Grida — a logistics",
    "app for loading flower orders into trailer walls. Domain terms:",
    'a "shipment" (рейс) has numbered "walls" (стены); each order has',
    "boxes placed on walls; an order is done / loaded / pending.",
    "",
    "Rules:",
    "- NEVER guess numbers. For any count, progress, or urgency question,",
    "  call a tool and answer strictly from its result.",
    "- If a tool errors or you lack a tool for the question, say so",
    "  honestly and suggest what the user can do in the UI instead.",
    "- Keep answers short and concrete, but always reply with a complete",
    "  sentence (e.g. 'There are 6 urgent open orders'), never a bare number.",
    `- Reply in ${language}.`,
    ...(locale === "ru"
      ? [
          "- Your name is Mira (Мира) — feminine in Russian. Refer to",
          "  yourself with feminine forms: «нашла», «посмотрела», «готова».",
        ]
      : []),
    "",
    shipmentContext,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, 405, { error: "method_not_allowed" });
  }

  // FR-CP-08: graceful absence of the model key — app must not crash.
  const geminiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
  if (!geminiKey) {
    return jsonResponse(req, 503, { error: "copilot_unavailable" });
  }

  // Build a Supabase client AS THE CALLER — RLS applies to all tool queries.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonResponse(req, 401, { error: "unauthorized" });
  }

  let payload: CopilotPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(req, 400, { error: "invalid_json" });
  }
  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return jsonResponse(req, 400, { error: "messages_required" });
  }

  const role: CopilotRole =
    user.user_metadata?.role === "worker" ? "worker" : "operator";
  const locale: CopilotLocale = payload.locale === "ru" ? "ru" : "en";

  // --- Thread resolution (GRD-124) ---
  // Existing thread: verify ownership (RLS scopes the select — a foreign
  // id simply returns no row). No thread: create one lazily, titled from
  // the user's first message. Persistence failures never block the chat.
  const lastUserMessage = [...payload.messages]
    .reverse()
    .find((m) => m.role === "user");
  let threadId: string | null =
    typeof payload.threadId === "string" && UUID_RE.test(payload.threadId)
      ? payload.threadId
      : null;

  if (threadId) {
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread) {
      return jsonResponse(req, 404, { error: "thread_not_found" });
    }
  } else {
    const { data: created, error: createError } = await supabase
      .from("chat_threads")
      .insert({
        user_id: user.id,
        title: threadTitle(textOf(lastUserMessage)),
        shipment_id:
          payload.shipmentId && UUID_RE.test(payload.shipmentId)
            ? payload.shipmentId
            : null,
      })
      .select("id")
      .single();
    if (createError) {
      console.error("copilot thread create error:", createError);
    } else {
      threadId = created.id;
    }
  }

  const ctx: ToolContext = { supabase, role, userId: user.id, locale };

  // Registry → AI SDK shape. The model only ever sees role-allowed tools.
  const aiTools = Object.fromEntries(
    filterByRole(role).map((t) => [
      t.name,
      tool({
        description: t.description,
        inputSchema: jsonSchema(t.parameters),
        execute: (args: unknown) => t.execute(args, ctx),
      }),
    ])
  );

  const google = createGoogleGenerativeAI({ apiKey: geminiKey });

  const result = streamText({
    model: google(MODEL_ID),
    system: buildSystemPrompt(locale, payload.shipmentId),
    messages: convertToModelMessages(payload.messages),
    tools: aiTools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    onError: ({ error }) => {
      console.error("copilot streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: payload.messages,
    headers: {
      ...getCorsHeaders(req),
      ...(threadId ? { "x-thread-id": threadId } : {}),
    },
    // Persist the exchanged turn AFTER the stream completes. Parts are
    // stored verbatim (AD-Copilot-05) so history replay re-renders
    // chains/approvals with no mapping code. Sequential inserts keep
    // created_at ordering unambiguous.
    onFinish: async ({ responseMessage }) => {
      if (!threadId) return;
      try {
        if (lastUserMessage) {
          await supabase.from("chat_messages").insert({
            thread_id: threadId,
            role: "user",
            parts: lastUserMessage.parts,
          });
        }
        if (responseMessage && responseMessage.parts.length > 0) {
          await supabase.from("chat_messages").insert({
            thread_id: threadId,
            role: "assistant",
            parts: responseMessage.parts,
          });
        }
        await supabase
          .from("chat_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } catch (e) {
        console.error("copilot persistence error:", e);
      }
    },
  });
});

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
  createUIMessageStream,
  createUIMessageStreamResponse,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
  type UIMessageStreamWriter,
} from "npm:ai@5";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google@2";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  filterByRole,
  type CopilotLocale,
  type CopilotRole,
  type CopilotTool,
  type ToolContext,
} from "../_shared/copilot-tools/index.ts";

// ------------------------------------------------------------
// HITL approval protocol (GRD-125, AD-Copilot-06).
// Kept in sync with src/components/copilot/approval-utils.ts —
// the client writes {decision} via addToolResult, this function
// executes and replaces the output with {…, executed: true}.
// ------------------------------------------------------------
interface ApprovalOutput {
  decision: "approved" | "rejected";
  /** true once this function has acted on the decision. */
  executed?: boolean;
  /** Approval came from the per-thread allow-list, not a click. */
  auto?: boolean;
  result?: unknown;
  error?: string;
  message?: string;
}

type ToolUIPart = {
  type: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
};

function approvalPartsOf(
  message: UIMessage,
  approvalTools: Map<string, CopilotTool>
): Array<{ part: ToolUIPart; tool: CopilotTool }> {
  return message.parts
    .filter((p): p is ToolUIPart & { type: `tool-${string}` } =>
      p.type.startsWith("tool-")
    )
    .map((part) => ({
      part: part as ToolUIPart,
      tool: approvalTools.get(part.type.slice("tool-".length))!,
    }))
    .filter((x) => x.tool !== undefined);
}

/**
 * Acts on the user's approval decisions carried in the message history:
 * executes approved tool calls (under the caller's RLS), marks rejected
 * ones, audits every decision in agent_actions, and streams the final
 * outputs back so the client's cards collapse. Pending approvals in
 * OLDER messages (user typed past the card) are marked as skipped so
 * convertToModelMessages never sees a dangling tool call.
 */
async function processApprovals(
  messages: UIMessage[],
  approvalTools: Map<string, CopilotTool>,
  ctx: ToolContext,
  threadId: string | null,
  writer: UIMessageStreamWriter
): Promise<UIMessage[]> {
  const processed = structuredClone(messages) as UIMessage[];
  const last = processed[processed.length - 1];

  for (const message of processed) {
    if (message.role !== "assistant") continue;
    for (const { part, tool: copilotTool } of approvalPartsOf(
      message,
      approvalTools
    )) {
      const output = part.output as ApprovalOutput | undefined;

      // Decision present and not yet acted on → execute / reject now.
      if (part.state === "output-available" && output?.decision && !output.executed) {
        let final: ApprovalOutput;
        let auditResult: "approved" | "rejected" | "error" = output.decision;
        let auditError: string | null = null;

        if (output.decision === "approved") {
          try {
            const result = await copilotTool.execute(part.input, ctx);
            final = { ...output, executed: true, result };
          } catch (e) {
            auditResult = "error";
            auditError = e instanceof Error ? e.message : String(e);
            final = { ...output, executed: true, error: auditError };
          }
        } else {
          final = {
            ...output,
            executed: true,
            message: "The user rejected this action.",
          };
        }

        part.output = final;
        writer.write({
          type: "tool-output-available",
          toolCallId: part.toolCallId,
          output: final,
        });

        // Audit every decision (PRD §4a). Failures must not kill the chat.
        const { error: auditInsertError } = await ctx.supabase
          .from("agent_actions")
          .insert({
            user_id: ctx.userId,
            thread_id: threadId,
            tool_name: copilotTool.name,
            args: part.input ?? {},
            result: auditResult,
            error: auditError,
          });
        if (auditInsertError) {
          console.error("agent_actions insert error:", auditInsertError);
        }
        continue;
      }

      // Undecided card in an older message: the user moved on without
      // answering. Tell the model it was skipped (the stored client copy
      // keeps the card pending — the user can still decide on replay).
      if (part.state === "input-available" && message !== last) {
        part.state = "output-available";
        part.output = {
          decision: "rejected",
          executed: false,
          message: "The user did not act on this proposal — skipped.",
        } satisfies ApprovalOutput;
      }
    }
  }

  return processed;
}

// Overridable without a redeploy (supabase secrets set COPILOT_MODEL=…):
// the free tier caps requests PER DAY PER MODEL, so switching to e.g.
// gemini-2.5-flash-lite buys a separate daily quota when testing burns
// through the default model's allowance.
const MODEL_ID = Deno.env.get("COPILOT_MODEL") ?? "gemini-2.5-flash";
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
    "- Write actions (mark_order_done, undo_done) require the user's",
    "  approval: your tool call renders as an approval card in the chat.",
    "  Call the tool with the order number the user named — never invent",
    "  one. Do not ask for confirmation in text first; the card IS the",
    "  confirmation. One tool call per order.",
    "- A tool result with decision='rejected' means the user declined —",
    "  acknowledge briefly and do NOT retry the same action.",
    "- A tool result with an 'error' field means the action failed —",
    "  relay the reason honestly.",
    "- Act ONLY on the user's most recent message. Earlier messages may",
    "  be repeats of requests that failed with errors — do NOT act on",
    "  them, and NEVER propose the same action twice for the same order.",
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
  // HITL tools (AD-Copilot-06) are exposed WITHOUT execute: the call
  // streams to the client as an approval card; processApprovals() runs
  // the real logic after the user decides.
  const roleTools = filterByRole(role);
  const approvalTools = new Map(
    roleTools.filter((t) => t.requiresApproval).map((t) => [t.name, t])
  );
  const aiTools = Object.fromEntries(
    roleTools.map((t) => [
      t.name,
      tool({
        description: t.description,
        inputSchema: jsonSchema(t.parameters),
        ...(t.requiresApproval
          ? {}
          : { execute: (args: unknown) => t.execute(args, ctx) }),
      }),
    ])
  );

  const google = createGoogleGenerativeAI({ apiKey: geminiKey });

  const stream = createUIMessageStream({
    originalMessages: payload.messages,
    execute: async ({ writer }) => {
      // Act on any approval decisions the client sent back, then hand
      // the (now dangling-call-free) history to the model.
      const processedMessages = await processApprovals(
        payload.messages,
        approvalTools,
        ctx,
        threadId,
        writer
      );

      const result = streamText({
        model: google(MODEL_ID),
        system: buildSystemPrompt(locale, payload.shipmentId),
        messages: convertToModelMessages(processedMessages),
        tools: aiTools,
        stopWhen: stepCountIs(MAX_STEPS),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // Stage D (FR-CP-16): stream Gemini's reasoning so the client can
        // render a collapsible thinking block. The budget bounds extra
        // token spend; models that emit no thoughts degrade silently.
        providerOptions: {
          google: {
            thinkingConfig: { includeThoughts: true, thinkingBudget: 512 },
          },
        },
        onError: ({ error }) => {
          console.error("copilot streamText error:", error);
        },
      });

      writer.merge(
        result.toUIMessageStream({
          originalMessages: processedMessages,
          sendReasoning: true,
        })
      );
    },
    // Persist the exchanged turn AFTER the stream completes. Parts are
    // stored verbatim (AD-Copilot-05). Upsert on (thread_id, message_id):
    // an approval continuation finishes the SAME assistant message in a
    // second request, which must update the stored row, not duplicate it.
    onFinish: async ({ responseMessage }) => {
      if (!threadId) return;
      // A turn that produced NO assistant content (model/quota error)
      // is not persisted at all — otherwise failed attempts pile up in
      // history as unanswered requests and a later model acts on the
      // whole backlog at once.
      if (!responseMessage || responseMessage.parts.length === 0) return;
      try {
        if (lastUserMessage) {
          await supabase.from("chat_messages").upsert(
            {
              thread_id: threadId,
              role: "user",
              parts: lastUserMessage.parts,
              message_id: lastUserMessage.id,
            },
            { onConflict: "thread_id,message_id" }
          );
        }
        await supabase.from("chat_messages").upsert(
          {
            thread_id: threadId,
            role: "assistant",
            parts: responseMessage.parts,
            message_id: responseMessage.id,
          },
          { onConflict: "thread_id,message_id" }
        );
        await supabase
          .from("chat_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } catch (e) {
        console.error("copilot persistence error:", e);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      ...getCorsHeaders(req),
      ...(threadId ? { "x-thread-id": threadId } : {}),
    },
  });
});

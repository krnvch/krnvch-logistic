import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_TEAM_ID = "56860a7b-225e-4e7b-b492-dc51272a4ab6";
const LINEAR_PROJECT_ID = "697b3247-7df8-46c4-89f5-c26aab1afb2c";

const ALLOWED_ORIGINS = [
  "https://app.grida.space",
  "http://localhost:5173",
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
  };
}

interface SuggestionPayload {
  text: string;
  userRole: string;
  page: string;
}

function extractTitle(text: string): string {
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  return firstSentence.length > 80
    ? firstSentence.slice(0, 77) + "..."
    : firstSentence;
}

function buildDescription(payload: SuggestionPayload): string {
  const now = new Date().toISOString();
  return `${payload.text}\n\n---\nRole: ${payload.userRole}\nPage: ${payload.page}\nDate: ${now}`;
}

function validate(
  payload: SuggestionPayload
): { valid: true } | { valid: false; error: string } {
  if (!payload.text || typeof payload.text !== "string") {
    return { valid: false, error: "text is required" };
  }
  if (payload.text.length < 10) {
    return { valid: false, error: "text must be at least 10 characters" };
  }
  if (payload.text.length > 1000) {
    return { valid: false, error: "text must be at most 1000 characters" };
  }
  if (!["operator", "worker"].includes(payload.userRole)) {
    return { valid: false, error: 'userRole must be "operator" or "worker"' };
  }
  if (!payload.page || typeof payload.page !== "string") {
    return { valid: false, error: "page is required" };
  }
  if (payload.page.length > 200) {
    return { valid: false, error: "page must be at most 200 characters" };
  }
  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("LINEAR_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false, error: "LINEAR_API_KEY not configured" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  let payload: SuggestionPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  const validation = validate(payload);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: validation.error }),
      {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  const title = extractTitle(payload.text);
  const description = buildDescription(payload);

  const mutation = `
    mutation CreateSuggestion($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      teamId: LINEAR_TEAM_ID,
      projectId: LINEAR_PROJECT_ID,
      title,
      description,
    },
  };

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Linear API error:", errorText);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to create Linear issue" }),
      {
        status: 502,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  const result = await response.json();

  if (result.errors) {
    console.error("Linear GraphQL errors:", result.errors);
    return new Response(
      JSON.stringify({ success: false, error: "Linear API returned errors" }),
      {
        status: 502,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  const issue = result.data?.issueCreate?.issue;
  return new Response(
    JSON.stringify({
      success: true,
      issueId: issue?.identifier,
      url: issue?.url,
    }),
    {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    }
  );
});

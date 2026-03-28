import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_TEAM_ID = "56860a7b-225e-4e7b-b492-dc51272a4ab6";
const LINEAR_PROJECT_ID = "c061e5fd-f418-4d06-9c74-89e5a2354b8c"; // Learning Roadmap
const LINEAR_TRIAGE_LABEL_ID = "2ff4316f-0e6f-4bc1-a239-9b9a275ded58";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number };
    text?: string;
  };
}

function extractTitleAndDescription(text: string): {
  title: string;
  description: string;
} {
  const lines = text.split("\n");
  const firstLine = lines[0].trim();
  const title =
    firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine;
  const rest = lines.slice(1).join("\n").trim();
  const description = rest || title;
  return { title, description };
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function createLinearIssue(
  apiKey: string,
  title: string,
  description: string
): Promise<{ identifier: string; url: string } | null> {
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          identifier
          url
        }
      }
    }
  `;

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          teamId: LINEAR_TEAM_ID,
          projectId: LINEAR_PROJECT_ID,
          labelIds: [LINEAR_TRIAGE_LABEL_ID],
          title,
          description,
        },
      },
    }),
  });

  if (!response.ok) return null;

  const result = await response.json();
  if (result.errors || !result.data?.issueCreate?.success) return null;

  return result.data.issueCreate.issue;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const linearKey = Deno.env.get("LINEAR_API_KEY");
  const allowedUserId = Number(Deno.env.get("TELEGRAM_ALLOWED_USER_ID"));

  if (!botToken || !linearKey || !allowedUserId) {
    console.error("Missing environment variables");
    return new Response("OK", { status: 200 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response("OK", { status: 200 });
  }

  const message = update.message;
  if (!message?.text || !message.from) {
    return new Response("OK", { status: 200 });
  }

  const chatId = message.chat.id;
  const userId = message.from.id;

  // Auth: only allow the configured user
  if (userId !== allowedUserId) {
    await sendTelegramMessage(
      botToken,
      chatId,
      "Sorry, this bot is private."
    );
    return new Response("OK", { status: 200 });
  }

  const text = message.text.trim();

  // Handle /start command
  if (text === "/start") {
    await sendTelegramMessage(
      botToken,
      chatId,
      "Hey! Send me any message and I'll create a Linear issue in the Learning Roadmap project.\n\n" +
        "First line = title, rest = description."
    );
    return new Response("OK", { status: 200 });
  }

  // Ignore other commands
  if (text.startsWith("/")) {
    await sendTelegramMessage(
      botToken,
      chatId,
      "Just send me a text message — no commands needed."
    );
    return new Response("OK", { status: 200 });
  }

  if (text.length < 3) {
    await sendTelegramMessage(
      botToken,
      chatId,
      "Too short — give me at least a few words."
    );
    return new Response("OK", { status: 200 });
  }

  const { title, description } = extractTitleAndDescription(text);
  const issue = await createLinearIssue(linearKey, title, description);

  if (!issue) {
    await sendTelegramMessage(
      botToken,
      chatId,
      "Failed to create issue. Try again later."
    );
    return new Response("OK", { status: 200 });
  }

  await sendTelegramMessage(
    botToken,
    chatId,
    `Created *${issue.identifier}*: ${title}\n[Open in Linear](${issue.url})`
  );

  return new Response("OK", { status: 200 });
});

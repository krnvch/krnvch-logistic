// ============================================================
// Copilot tool registry — core types (GRD-104, AD-Copilot-03)
// ============================================================
// Framework-agnostic by design: NO Vercel AI SDK imports, NO MCP
// imports. The Copilot Edge Function adapts these tools to the AI SDK
// `tools` shape; the future MCP server (GRD-105) adapts the SAME array
// to MCP tool definitions. Business logic is written once.
// ============================================================

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type CopilotRole = "operator" | "worker";

export type CopilotLocale = "en" | "ru";

/**
 * Everything a tool needs to run, injected per request.
 * `supabase` is created with the CALLER's JWT — RLS applies to every
 * query a tool makes. Never pass a service-role client here.
 */
export interface ToolContext {
  supabase: SupabaseClient;
  role: CopilotRole;
  userId: string;
  locale: CopilotLocale;
}

export interface CopilotTool<Args = unknown, Result = unknown> {
  name: string;
  /** Shown to the model — must explain WHEN to use the tool. */
  description: string;
  /**
   * Plain JSON Schema object (NOT zod). Consumed by the Vercel AI SDK
   * via its `jsonSchema()` helper AND by MCP tool definitions verbatim.
   */
  parameters: Record<string, unknown>;
  /** The Edge Function filters the registry by caller role before the model sees it. */
  allowedRoles: CopilotRole[];
  execute(args: Args, ctx: ToolContext): Promise<Result>;
}

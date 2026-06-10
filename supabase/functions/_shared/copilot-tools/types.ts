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
  /**
   * Write tools require human approval (AD-Copilot-06): the Edge Function
   * exposes them to the model WITHOUT execute, the call streams to the
   * client as an approval card, and `execute` runs server-side only after
   * the user approves. The future MCP server (GRD-105) must map these to
   * MCP elicitation — never auto-run them.
   */
  requiresApproval?: boolean;
  /**
   * "destructive" (GRD-131, FR-OC-01): the card offers Delete/Cancel only —
   * no "always allow in this session", excluded from every auto-approve
   * path on the client AND must map to per-call elicitation in MCP.
   * Absent = "standard" for requiresApproval tools.
   */
  approvalTier?: "standard" | "destructive";
  execute(args: Args, ctx: ToolContext): Promise<Result>;
}

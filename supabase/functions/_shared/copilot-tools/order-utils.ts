// ============================================================
// Shared helpers for order-targeting tools (GRD-125 / GRD-131)
// ============================================================

/**
 * Users type "ham-028", "#HAM-028" — and voice input dictates "H A M 020".
 * Equality on the raw string misses all of them, so both sides are
 * reduced to bare alphanumerics, uppercase: "H A M 020" → "HAM020".
 */
export function normalizeOrderNumber(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

/** "#HAM-031 " → "HAM-031" — what we actually store on create/renumber. */
export function cleanOrderNumber(value: string): string {
  return value.trim().replace(/^#/, "");
}

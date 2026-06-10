// ============================================================
// Voice output helpers (GRD-127, Mira voice mode).
// speechSynthesis is browser-built-in: OS voices, works offline,
// costs nothing. Only Mira's FINAL answer text is spoken — never
// reasoning blocks or approval cards.
// ============================================================

/**
 * Markdown reads terribly aloud ("asterisk asterisk urgent…").
 * Strip the formatting Mira actually uses: bold/italic markers,
 * inline code, headings, list bullets, links (keep the label).
 */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks: skip entirely
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A message grows across approval continuations (same id, more text).
 * Returns only the not-yet-spoken tail so we never re-read the start.
 */
export function unspokenTail(fullText: string, spokenLength: number): string {
  if (spokenLength <= 0) return fullText;
  if (spokenLength >= fullText.length) return "";
  return fullText.slice(spokenLength).trim();
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Speak text in the given locale, cancelling anything still playing. */
export function speak(text: string, locale: string): void {
  if (!speechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === "ru" ? "ru-RU" : "en-US";
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

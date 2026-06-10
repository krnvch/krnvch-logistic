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

export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

/**
 * The OS default voice is often the most robotic one available. Rank
 * the locale's voices by quality markers: neural/system-premium names
 * first ("Enhanced", "Premium", "Natural", "Neural"), then Chrome's
 * network "Google …" voices, then anything non-local (network voices
 * are usually the newer engines). GRD-130 tracks true neural TTS.
 */
export function pickVoice<T extends VoiceLike>(
  voices: T[],
  locale: string
): T | null {
  const prefix = locale === "ru" ? "ru" : "en";
  const candidates = voices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith(prefix)
  );
  if (candidates.length === 0) return null;
  const score = (v: VoiceLike) =>
    (/(natural|premium|enhanced|neural)/i.test(v.name) ? 5 : 0) +
    (/google/i.test(v.name) ? 3 : 0) +
    (v.localService === false ? 1 : 0);
  return candidates.reduce(
    (best, v) => (score(v) > score(best) ? v : best),
    candidates[0]
  );
}

// getVoices() is empty until the browser fires voiceschanged — cache
// the list and keep it fresh.
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesHooked = false;

function loadVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  if (!voicesHooked) {
    voicesHooked = true;
    window.speechSynthesis.addEventListener?.("voiceschanged", () => {
      cachedVoices = window.speechSynthesis.getVoices();
    });
  }
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

/** Speak text in the given locale, cancelling anything still playing. */
export function speak(text: string, locale: string): void {
  if (!speechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === "ru" ? "ru-RU" : "en-US";
  const voice = pickVoice(loadVoices(), locale);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

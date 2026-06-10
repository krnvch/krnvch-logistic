import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// Push-to-talk speech recognition (GRD-127, Mira voice mode).
// Thin wrapper over the browser's Web Speech API: free, no server,
// no model quota. Feature-detected — Firefox has no SpeechRecognition,
// so callers hide the mic entirely when `supported` is false.
// Note: Chrome routes audio through Google's servers for recognition;
// Safari runs it on-device.
// ============================================================

// The Web Speech API has no bundled TS types in our targets — minimal
// structural typings for the slice we use.
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognition {
  /** False on browsers without the API (Firefox) — hide the mic. */
  supported: boolean;
  listening: boolean;
  /** Start capturing; emits live transcripts via the callback. */
  start: () => void;
  /** Stop capturing (push-to-talk release); final result still arrives. */
  stop: () => void;
}

export function useSpeechRecognition(
  lang: string,
  onTranscript: (text: string, isFinal: boolean) => void
): UseSpeechRecognition {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const supported = getRecognitionCtor() !== null;

  // The callback lives in a ref so a recognition session survives
  // re-renders without re-subscribing.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.lang = lang === "ru" ? "ru-RU" : "en-US";
    recognition.continuous = true; // keep capturing while the button is held
    recognition.interimResults = true; // live text while speaking

    recognition.onresult = (e) => {
      // Join everything recognized so far in this session; interim
      // chunks keep replacing each other until they finalize.
      let text = "";
      let isFinal = true;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (!e.results[i].isFinal) isFinal = false;
      }
      onTranscriptRef.current(text.trim(), isFinal);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onerror = () => {
      // Treated like end: mic released, whatever was recognized stays.
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [lang]);

  // Abort a dangling session on unmount.
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  return { supported, listening, start, stop };
}

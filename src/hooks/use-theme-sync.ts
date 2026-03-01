import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Theme } from "@/types";

const VALID_THEMES: Theme[] = ["light", "dark", "system"];

function isValidTheme(value: unknown): value is Theme {
  return typeof value === "string" && VALID_THEMES.includes(value as Theme);
}

export function useThemeSync(session: Session | null) {
  const { theme, setTheme } = useTheme();
  const synced = useRef(false);
  const prevTheme = useRef(theme);

  // On login: load theme from Supabase metadata (one-time)
  useEffect(() => {
    if (!session || synced.current) return;
    synced.current = true;

    const savedTheme = session.user.user_metadata?.theme;
    if (isValidTheme(savedTheme)) {
      setTheme(savedTheme);
    }
  }, [session, setTheme]);

  // On theme change: save to Supabase metadata (background, fire-and-forget)
  useEffect(() => {
    if (!session || !theme || theme === prevTheme.current) return;
    prevTheme.current = theme;

    if (!isValidTheme(theme)) return;

    supabase.auth.updateUser({ data: { theme } });
  }, [session, theme]);
}

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/types";

const VALID_LOCALES: Locale[] = ["en", "ru"];

function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && VALID_LOCALES.includes(value as Locale);
}

export function useLocaleSync(session: Session | null) {
  const { i18n } = useTranslation();
  const synced = useRef(false);
  const prevLocale = useRef(i18n.language);

  // On login: load locale from Supabase metadata (one-time)
  useEffect(() => {
    if (!session || synced.current) return;
    synced.current = true;

    const savedLocale = session.user.user_metadata?.locale;
    if (isValidLocale(savedLocale)) {
      i18n.changeLanguage(savedLocale);
    }
  }, [session, i18n]);

  // On language change: save to Supabase metadata (background, fire-and-forget)
  useEffect(() => {
    if (!session || !i18n.language || i18n.language === prevLocale.current)
      return;
    prevLocale.current = i18n.language;

    if (!isValidLocale(i18n.language)) return;

    supabase.auth.updateUser({ data: { locale: i18n.language } });
  }, [session, i18n.language]);
}

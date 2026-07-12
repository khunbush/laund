"use client";

import { createContext, useContext, type ReactNode } from "react";
import { t, tn, type Lang, type MsgKey } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

/** Wraps a page so client components can read the language chosen on the
 * server (each server page reads the cookie and passes it down). */
export function I18nProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT() {
  const lang = useLang();
  return {
    lang,
    t: (key: MsgKey, params?: Record<string, string | number>) =>
      t(lang, key, params),
    tn: (
      key: Parameters<typeof tn>[1],
      n: number,
      params?: Record<string, string | number>,
    ) => tn(lang, key, n, params),
  };
}

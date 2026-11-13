"use client";

import { createContext, useContext, type ReactNode } from "react";
import { t, type UiKey } from "@/lib/i18n/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Provider 밖이면 한국어 */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** 현재 언어로 화면 문구를 고르는 함수. Provider 밖이면 한국어. */
export function useT(): (key: UiKey) => string {
  const locale = useLocale();
  return (key) => t(locale, key);
}

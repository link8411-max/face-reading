"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { counterpart } from "@/lib/i18n/alternates";
import { LANG_COOKIE, SUGGEST_COOKIE, readCookie, writeLangCookie } from "@/lib/i18n/cookie";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { t } from "@/lib/i18n/dict";

// 한국어 페이지 위쪽의 얇은 띠 "View this page in English". 해외 방문자(proxy가 lang_suggest 쿠키를 심음)에게만,
// 마운트 뒤에만 뜬다(서버 HTML에는 없다). 누르면 영어를 기억하고 이동, 닫으면 한국어를 기억해 다시 안 뜬다.
export default function LanguageBanner() {
  const locale = useLocale();
  const path = usePathname() ?? "/";
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(locale === "ko" && readCookie(SUGGEST_COOKIE) === "en" && !readCookie(LANG_COOKIE));
  }, [locale, path]);

  const target = counterpart(path, "en");
  if (!show || !target) return null;

  return (
    <div role="region" aria-label="Language" className="no-screenshot flex items-center justify-between gap-2 bg-ink text-paper px-4 h-10 text-[13px]">
      <button
        type="button"
        className="font-medium underline underline-offset-2"
        onClick={() => {
          writeLangCookie("en");
          window.location.assign(target + (window.location.search || ""));
        }}
      >
        {t("en", "lang.viewInEnglish")}
      </button>
      <button
        type="button"
        aria-label={t("en", "lang.dismiss")}
        className="w-8 h-8 grid place-items-center text-paper/80"
        onClick={() => {
          writeLangCookie("ko");
          setShow(false);
        }}
      >
        ×
      </button>
    </div>
  );
}

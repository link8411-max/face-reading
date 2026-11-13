"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { counterpart } from "@/lib/i18n/alternates";
import { LANG_COOKIE, SUGGEST_COOKIE, readCookie, writeLangCookie } from "@/lib/i18n/cookie";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { t } from "@/lib/i18n/dict";

// 한국어 페이지 위쪽의 얇은 띠 "View this page in English". 해외 방문자(proxy가 lang_suggest 쿠키를 심음)에게만,
// 마운트 뒤에만 뜬다(서버 HTML에는 없다). 누르면 영어를 기억하고 이동한다.
// 닫기는 "띠 그만"일 뿐 언어 선택이 아니다(lang=ko를 쓰면 친구가 보낸 영어 링크가 한국어로 넘어간다) → lang_suggest만 dismissed로.
// 화면 위에 겹쳐 떠서 아래 내용을 밀지 않는다(레이아웃 밀림 방지).
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
    <div role="region" aria-label="Language" className="no-screenshot fixed top-0 inset-x-0 z-[60] flex items-center justify-between gap-2 bg-ink text-paper px-4 h-10 text-[13px] shadow-md">
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
          document.cookie = `${SUGGEST_COOKIE}=dismissed; Path=/; Max-Age=31536000; SameSite=Lax`;
          setShow(false);
        }}
      >
        ×
      </button>
    </div>
  );
}

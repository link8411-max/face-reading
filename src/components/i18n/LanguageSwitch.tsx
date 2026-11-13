"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { counterpart } from "@/lib/i18n/alternates";
import { writeLangCookie } from "@/lib/i18n/cookie";
import { t } from "@/lib/i18n/dict";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABEL, localePath, type Locale } from "@/lib/i18n/locales";

/** 언어를 바꿀 때 갈 주소: 같은 페이지의 다른 언어판, 없으면 그 언어 홈(+ ?only=<지금 언어>로 "그 페이지는 지금 언어로만 있어요" 안내) */
export function switchTarget(path: string, search: string, to: Locale, from: Locale): string {
  const same = counterpart(path + search, to);
  if (same) return same;
  return `${localePath(to, "/")}?only=${from}`;
}

// 헤더 오른쪽의 지구 아이콘 + 현재 언어 이름. 누르면 언어 목록, 고르면 그 언어를 기억하고 이동한다.
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const choose = (to: Locale) => {
    setOpen(false);
    if (to === locale) return;
    writeLangCookie(to);
    // 루트 레이아웃이 언어마다 달라 전체를 새로 불러온다
    window.location.assign(switchTarget(path, window.location.search, to, locale));
  };

  return (
    <div ref={box} className={`no-screenshot relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(locale, "lang.switch")}
        onClick={() => setOpen((o) => !o)}
        className="h-11 px-2 inline-flex items-center gap-1 text-[12px] font-medium text-ink"
      >
        <Icon name="globe" size={18} />
        {LOCALE_LABEL[locale]}
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 top-full z-50 min-w-[120px] rounded-[16px] border border-line bg-card py-1 shadow-sm">
          {LOCALES.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={l === locale}
                lang={l}
                onClick={() => choose(l)}
                className={`w-full h-10 px-4 text-left text-sm ${l === locale ? "font-bold text-accent-ink" : "text-ink"}`}
              >
                {LOCALE_LABEL[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

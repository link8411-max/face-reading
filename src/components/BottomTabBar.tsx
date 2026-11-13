"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, tabForPath } from "@/content/navigation";
import { Icon } from "@/components/icons";
import { useT, useLocale } from "@/lib/i18n/LocaleProvider";
import { localePath } from "@/lib/i18n/locales";

/** 탭바를 숨기는 경로(게임이 화면을 다 쓰는 곳) */
export const HIDE_ON = ["/samguk/duel"];

// 모든 페이지 공통 하단 탭바 (결과 이미지 캡처에서는 제외). 표시 막대가 현재 탭으로 미끄러진다.
export default function BottomTabBar() {
  const path = usePathname() ?? "/";
  const t = useT();
  const locale = useLocale();
  const en = locale === "en";
  // 영어판은 홈·전체 둘(오늘 탭은 영어판이 없다)
  const tabs = en ? TABS.filter((x) => x.key !== "today") : TABS;
  const current = en ? (path === "/en" ? "home" : "all") : tabForPath(path);
  const index = Math.max(0, tabs.findIndex((x) => x.key === current));
  const cols = tabs.length;
  // 일기토 게임 화면에서는 숨긴다(캔버스·결과 화면 배너를 가리지 않게)
  if (HIDE_ON.includes(path)) return null;
  return (
    <nav
      aria-label={t("nav.bottom")}
      className="no-screenshot fixed bottom-0 inset-x-0 z-50 bg-white border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <ul className={`relative max-w-lg mx-auto grid ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        <span
          aria-hidden
          className={`tab-indicator absolute top-0 ${cols === 3 ? "w-1/3" : "w-1/2"} flex justify-center pointer-events-none`}
          style={{ left: `calc(${index} * ${cols === 3 ? "33.333%" : "50%"})` }}
        >
          <span className="block w-[22px] h-[3px] rounded-[3px] bg-accent" />
        </span>
        {tabs.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key}>
              <Link
                href={localePath(locale, tab.href)}
                aria-current={active ? "page" : undefined}
                className={`press flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-semibold whitespace-nowrap ${active ? "text-accent" : "text-ink"}`}
              >
                <Icon name={tab.icon} className={active ? "tab-pop" : undefined} />
                {en ? t(`tab.${tab.key}` as "tab.home") : tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

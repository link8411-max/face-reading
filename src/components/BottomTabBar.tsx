"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, tabForPath } from "@/content/navigation";
import { Icon } from "@/components/icons";

/** 탭바를 숨기는 경로(게임이 화면을 다 쓰는 곳) */
export const HIDE_ON = ["/samguk/duel"];

// 모든 페이지 공통 하단 탭바 (결과 이미지 캡처에서는 제외)
export default function BottomTabBar() {
  const path = usePathname() ?? "/";
  const current = tabForPath(path);
  // 일기토 게임 화면에서는 숨긴다(캔버스·결과 화면 배너를 가리지 않게)
  if (HIDE_ON.includes(path)) return null;
  return (
    <nav
      aria-label="하단 메뉴"
      className="no-screenshot fixed bottom-0 inset-x-0 z-50 bg-white border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="max-w-lg mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.key === current;
          return (
            <li key={t.key}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium ${active ? "text-accent" : "text-ink"}`}
              >
                <Icon name={t.icon} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

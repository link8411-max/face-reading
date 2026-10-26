"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS, tabForPath } from "@/content/navigation";
import { Icon } from "@/components/icons";

// 모든 페이지 공통 하단 탭바 (결과 이미지 캡처에서는 제외)
export default function BottomTabBar() {
  const current = tabForPath(usePathname() ?? "/");
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

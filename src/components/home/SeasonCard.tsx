"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { SEASON, seasonFor } from "@/content/season";
import { onDayMaybeChanged } from "@/lib/kst";

// 시즌 띠(높이 64px 한 줄). 홈이 정적이라 서버 HTML은 기본 카드(SEASON)이고, 마운트 뒤 한국 날짜에 맞는 카드로 바꾼다.
// 높이가 고정이라 바뀌어도 아래 칸이 밀리지 않는다. 자정을 넘긴 탭은 다시 보일 때 갱신.
export default function SeasonCard() {
  const [season, setSeason] = useState(SEASON);
  useEffect(() => {
    const update = () => setSeason((prev) => {
      const next = seasonFor(new Date());
      return prev.chip === next.chip ? prev : next;
    });
    update();
    return onDayMaybeChanged(update);
  }, []);
  return (
    <section aria-label={season.chip} className="press h-16 bg-card-2 rounded-[22px]">
      <Link href={season.cta.href} aria-label={season.cta.label} className="h-full flex items-center gap-3 px-4">
        <span className="flex-none text-xs font-bold bg-lime text-paper px-2.5 py-1 rounded-full">{season.chip}</span>
        <span className="flex-1 min-w-0">
          <h2 className="block font-serif font-bold text-[14px] leading-tight truncate">{season.title.replace("\n", " ")}</h2>
          <span className="block text-xs text-muted mt-0.5 truncate">{season.sub}</span>
        </span>
        <Icon name="chevron" size={18} className="flex-none text-accent-ink" />
      </Link>
    </section>
  );
}

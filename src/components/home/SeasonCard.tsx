"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SEASON, seasonFor } from "@/content/season";
import { onDayMaybeChanged } from "@/lib/kst";

// 시즌 카드. 홈이 정적이라 서버 HTML은 기본 카드(SEASON)이고, 마운트 뒤 한국 날짜에 맞는 카드로 바꾼다.
// 카드 높이(제목 두 줄·부제 한 줄·버튼)가 같아 바뀌어도 아래 칸이 밀리지 않는다. 자정을 넘긴 탭은 다시 보일 때 갱신.
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
    <section aria-label={season.chip} className="bg-[#E6E8DF] rounded-[22px] p-5 flex items-center gap-3.5">
      <div className="flex-1">
        <p className="text-xs font-medium text-[#4F5A43]">{season.chip}</p>
        <h2 className="font-serif font-bold text-[17px] leading-[1.4] mt-1.5 whitespace-pre-line">{season.title}</h2>
        <p className="text-[13px] text-muted mt-1 max-[379px]:min-h-[39px]">{season.sub}</p>
        <Link href={season.cta.href} className="inline-flex items-center mt-3 h-11 px-5 rounded-full bg-ink text-paper text-sm font-medium">
          {season.cta.label}
        </Link>
      </div>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="24" cy="32" r="16" fill="#FBF6F1" />
        <circle cx="40" cy="32" r="16" fill="#CFD6C4" />
        <path d="M32 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#9A4F35" />
      </svg>
    </section>
  );
}

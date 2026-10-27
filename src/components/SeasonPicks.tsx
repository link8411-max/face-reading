"use client";

import { useEffect, useState } from "react";
import { activeSeason, seasonHeadline, type CoupangSeason } from "@/content/coupangSeasons";
import { track } from "@/lib/analytics";

// 시즌 추천 카드 (지금은 수능 합격 선물). 날짜를 보고 브라우저에서 보여 주거나 숨긴다(정적 페이지라 빌드 날짜에 묶이지 않게).
// 테스트 흐름(사진 → 결과) 안에는 넣지 않는다.
export default function SeasonPicks({ slot }: { slot: string }) {
  const [state, setState] = useState<{ season: CoupangSeason; headline: string } | null>(null);
  useEffect(() => {
    const now = new Date();
    const s = activeSeason(now);
    setState(s ? { season: s, headline: seasonHeadline(s, now) } : null);
  }, []);
  if (!state) return null;
  return <SeasonPicksView season={state.season} headline={state.headline} slot={slot} />;
}

export function SeasonPicksView({ season, headline, slot }: { season: CoupangSeason; headline: string; slot: string }) {
  return (
    <section aria-label={season.title} className="no-screenshot bg-card-2 rounded-[22px] p-4">
      <p className="text-xs font-medium text-accent">{headline}</p>
      <h2 className="font-serif font-bold text-[17px] mt-1">{season.title}</h2>
      <div className="flex flex-wrap gap-2 mt-3">
        {season.links.map((l) => (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="sponsored noopener"
            onClick={() => track("coupang_click", { slot, keyword: l.key })}
            className="h-10 px-4 rounded-full bg-white border border-line text-sm grid place-items-center"
          >
            {l.label}
          </a>
        ))}
      </div>
      <p className="text-[11px] text-muted mt-3 leading-normal">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
    </section>
  );
}

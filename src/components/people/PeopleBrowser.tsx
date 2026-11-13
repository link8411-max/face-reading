"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import ThreeKingdomsMap from "@/components/people/ThreeKingdomsMap";
import { FILTER_LABEL, matchedCount, todayCard, visibleIds, FIRST_PAGE, type HubCard, type HubFilter } from "@/lib/people/hubFilter";
import { kstDate, onDayMaybeChanged } from "@/lib/kst";

import { portraitThumb } from "@/lib/portraitThumb";
const FILTERS: HubFilter[] = ["all", "위", "촉", "오", "기타"];
const FACTION_NAME: Record<HubFilter, string> = { all: "전체", 위: "위나라", 촉: "촉나라", 오: "오나라", 기타: "군웅" };

function Portrait({ card, className, width, height }: { card: HubCard; className: string; width: number; height: number }) {
  if (card.portrait) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={portraitThumb(card.portrait)} alt={`${card.name} 초상`} width={width} height={height} loading="lazy" decoding="async" className={`${className} object-cover`} />;
  }
  return <div className={`${className} border border-dashed border-line bg-card-2 grid place-items-center text-xs text-muted text-center px-2`}>초상화 추가 예정</div>;
}

// 삼국 지도·세력 버튼·검색·인물 카드. 127명 카드는 모두 서버 HTML에 들어 있고(검색 로봇용), 화면에서는 보이기만 바꾼다.
export default function PeopleBrowser({ cards, afterMap }: { cards: HubCard[]; afterMap?: ReactNode }) {
  const [filter, setFilter] = useState<HubFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // 날짜는 브라우저에서 계산한다(정적 HTML·캐시의 어제 날짜 방지)
  useEffect(() => {
    const today = () => setDate(kstDate(new Date()));
    today();
    return onDayMaybeChanged(today);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: cards.length };
    for (const card of cards) c[card.faction] = (c[card.faction] ?? 0) + 1;
    return c;
  }, [cards]);

  const shown = useMemo(() => new Set(visibleIds(cards, { filter, query, expanded })), [cards, filter, query, expanded]);
  const total = matchedCount(cards, { filter, query });
  const searching = query.trim() !== "";
  const canMore = !searching && !expanded && total > FIRST_PAGE;
  const today = useMemo(() => (date ? todayCard(cards, date) : null), [cards, date]);

  // 지도·세력 버튼을 눌렀는데 목록 제목이 화면 아래(하단 탭바 높이 포함)에 있으면 제목이 보이게 부드럽게 내려간다
  const choose = (f: HubFilter) => {
    setFilter(f);
    setExpanded(false);
    const h = headingRef.current;
    if (h && h.getBoundingClientRect().top > window.innerHeight - 140) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      h.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <>
      <section aria-label="삼국 지도" className="mt-5">
        <ThreeKingdomsMap count={counts} selected={filter} onSelect={choose} />
        <div role="group" aria-label="세력 고르기" className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => choose(f)}
              className={`h-11 px-4 rounded-full border text-sm font-medium transition ${filter === f ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line hover:border-accent/50"}`}
            >
              {FILTER_LABEL[f]} <span className={filter === f ? "text-paper/80" : "text-muted"}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      {afterMap}

      <section id="people-list" aria-label="인물 목록" className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 ref={headingRef} className="scroll-mt-4 font-serif font-bold text-lg">{searching ? "검색 결과" : filter === "all" ? "누구부터 만나 볼까요" : `${FACTION_NAME[filter]} 인물`}</h2>
          <span className="text-xs text-muted" aria-live="polite">{searching ? `${total}명` : `${counts[filter] ?? 0}명`}</span>
        </div>
        <label className="mt-3 block">
          <span className="sr-only">인물 이름 검색</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름이나 자로 찾기 (예: 하후, 운장)"
            autoComplete="off"
            className="w-full h-12 rounded-full border border-line bg-white px-5 text-base outline-none focus:border-accent"
          />
        </label>
        {searching && total === 0 && <p className="mt-4 text-sm text-muted" role="status">찾는 인물이 아직 없어요</p>}
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <li key={c.id} data-person={c.id} className={shown.has(c.id) ? "" : "hidden"}>
              <Link href={`/samguk/people/${c.id}`} prefetch={false} className="block h-full overflow-hidden rounded-[22px] border border-line bg-white transition hover:border-accent/50">
                <Portrait card={c} className="w-full aspect-[4/5] h-auto" width={160} height={200} />
                <span className="block px-3 pt-2.5 pb-3.5">
                  <span className="block font-serif font-bold break-keep">{c.name}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted break-keep line-clamp-3">{c.line}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {canMore && (
          <button type="button" onClick={() => setExpanded(true)} className="mt-4 w-full h-12 rounded-full border border-line bg-white text-sm font-medium hover:border-accent/50">
            더 보기 ({total - FIRST_PAGE}명)
          </button>
        )}
      </section>

      {today && (
        <section aria-label="오늘의 인물" className="mt-8">
          <div className="rounded-[22px] border border-line bg-white p-4">
            <p className="text-xs font-bold text-accent">오늘의 인물</p>
            <div className="mt-2 flex gap-4">
              <Portrait card={today} className="w-[72px] h-[90px] rounded-xl flex-none" width={72} height={90} />
              <div className="min-w-0">
                <p className="font-serif font-bold text-lg break-keep">{today.name}</p>
                <p className="mt-1 text-sm leading-relaxed break-keep">{today.line}</p>
              </div>
            </div>
            {today.fact && <p className="mt-3 rounded-2xl bg-card-2 px-3 py-2 text-sm leading-relaxed break-keep"><span className="font-bold">알고 보면</span> {today.fact}</p>}
            <Link href={`/samguk/people/${today.id}`} prefetch={false} className="mt-3 inline-flex items-center h-11 px-4 rounded-full bg-accent text-white text-sm font-medium">
              {today.name} 열전 읽기
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

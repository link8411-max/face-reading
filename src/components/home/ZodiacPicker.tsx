"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 일간운세 } from "@/lib/dailyFortune";
import { ZODIAC_SLUGS, zodiac2027, type ZodiacSlug } from "@/content/fortune2027Zodiac";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";

const 요일목록 = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const;
type 요일 = keyof typeof 일간운세;

// 메인에서 띠를 바로 골라 오늘의 운세를 보는 영역. 날짜는 브라우저에서 마운트 뒤에 계산한다(서버와 불일치 방지).
export default function ZodiacPicker() {
  const [selected, setSelected] = useState<ZodiacSlug | null>(null);
  const [today, setToday] = useState<{ label: string; 요일: 요일 } | null>(null);

  useEffect(() => {
    const d = new Date();
    setToday({ label: `${d.getMonth() + 1}월 ${d.getDate()}일 ${요일목록[d.getDay()]}`, 요일: 요일목록[d.getDay()] as 요일 });
  }, []);

  const z = selected ? zodiac2027[selected] : null;
  const fortune = z && today ? 일간운세[today.요일][z.띠 as keyof (typeof 일간운세)[요일]] : null;

  return (
    <section aria-label="띠 바로 고르기">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif font-bold text-[19px]">오늘, 내 띠는?</h2>
        <Link href="/fortune/2027" className="text-[13px] text-muted">{FORTUNE_YEAR.year} 신년운세</Link>
      </div>
      <p className="text-xs text-muted mt-1">{today ? today.label : "\u00a0"} · 띠를 눌러 보세요</p>
      <div className="flex flex-wrap gap-2 mt-3.5">
        {ZODIAC_SLUGS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelected(s)}
            aria-pressed={selected === s}
            className={`h-10 px-4 rounded-full border text-sm transition ${selected === s ? "bg-ink text-paper border-ink" : "bg-white text-ink border-[#E2D8CA]"}`}
          >
            {zodiac2027[s].띠}
          </button>
        ))}
      </div>
      <div aria-live="polite">
      {z && fortune && (
        <div className="mt-3.5 rounded-[22px] bg-card-2 p-4 text-[13px] leading-relaxed">
          <p className="flex items-baseline justify-between gap-2">
            <b>{z.띠}띠 오늘의 한마디</b>
            <span className="text-xs text-accent font-medium">운세 {fortune.rating}/5</span>
          </p>
          <p className="mt-1">{fortune.한마디}</p>
          <p className="text-xs text-muted mt-1">행운의 시간 {fortune.행운시간} · 행운의 색 {fortune.행운색}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link href="/fortune/daily" className="h-11 grid place-items-center text-[13px] font-medium bg-white border border-line rounded-full">오늘의 운세 자세히</Link>
            <Link href={`/fortune/2027/${selected}`} className="h-11 grid place-items-center text-[13px] font-medium bg-ink text-paper rounded-full">{FORTUNE_YEAR.year} {z.띠}띠 운세</Link>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}

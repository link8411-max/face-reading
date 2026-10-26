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
    <section aria-label="띠 바로 고르기" className="bg-white border border-line rounded-[22px] p-4">
      <h2 className="font-bold text-[15px]">오늘, 내 띠의 하루는?</h2>
      <p className="text-xs text-muted mt-0.5 mb-3">{today ? today.label : " "} · 띠를 눌러 보세요</p>
      <div className="grid grid-cols-6 gap-1.5">
        {ZODIAC_SLUGS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSelected(s)}
            aria-pressed={selected === s}
            className={`rounded-xl py-1.5 text-[10px] font-bold transition ${selected === s ? "bg-vermilion text-white" : "bg-paper-2 text-ink"}`}
          >
            <span aria-hidden className="block text-lg leading-tight">{zodiac2027[s].이모지}</span>
            {zodiac2027[s].띠}
          </button>
        ))}
      </div>
      <div aria-live="polite">
      {z && fortune && (
        <div className="mt-3 rounded-2xl bg-[#FFF6F2] p-3 text-[13px] leading-relaxed">
          <p>
            <span className="text-gold tracking-wider">{"★".repeat(fortune.rating)}{"☆".repeat(5 - fortune.rating)}</span>{" "}
            <b>{z.띠}띠 오늘의 한마디</b>
          </p>
          <p className="mt-1">{fortune.한마디}</p>
          <p className="text-xs text-muted mt-1">행운의 시간 {fortune.행운시간} · 행운의 색 {fortune.행운색}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link href="/fortune/daily" className="text-center text-xs font-bold bg-white border border-line rounded-xl py-2">오늘의 운세 자세히</Link>
            <Link href={`/fortune/2027/${selected}`} className="text-center text-xs font-bold bg-vermilion text-white rounded-xl py-2">{FORTUNE_YEAR.year} {z.띠}띠 운세</Link>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}

import type { Ref } from "react";
import Link from "next/link";
import type { MbtiType } from "@/lib/mbti/compat";
import type { MbtiDaily } from "@/lib/mbti/daily";
import { mbtiProfiles } from "@/content/mbtiTypes";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 2026-10-27 → "10월 27일 화요일" (날짜 문자열 자체로 계산해 시간대와 무관)
export function dateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${WEEK[d.getUTCDay()]}요일`;
}

// 오늘의 MBTI 운세 결과 카드 (캡처 한 장 완결, 워터마크)
export default function MbtiDailyCard({ type, date, daily, captureRef, withMatchLink = true }: { type: MbtiType; date: string; daily: MbtiDaily; captureRef?: Ref<HTMLElement>; withMatchLink?: boolean }) {
  const rows = [["일", daily.work], ["연애", daily.love], ["관계", daily.relation]] as const;
  return (
    <article ref={captureRef} className="relative overflow-hidden bg-card rounded-[30px] px-[22px] pt-6 pb-5 flex flex-col text-ink">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true" className="absolute -right-2.5 -top-1.5">
        <circle cx="74" cy="46" r="32" fill="#FBF6F1" />
        <circle cx="90" cy="36" r="29" fill="#ECE5D9" />
        <path d="M26 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#9A4F35" />
      </svg>
      <p className="relative text-xs font-medium text-accent">{dateLabel(date)} · 오늘의 MBTI 운세</p>
      <h2 className="relative font-serif font-bold text-[25px] leading-[1.4] mt-2 pr-16">
        {type} <span className="text-base font-medium text-muted">{mbtiProfiles[type].nickname}</span>
      </h2>
      <p className="relative font-serif text-[19px] leading-[1.55] mt-3 break-keep">{daily.headline}</p>
      <div className="bg-paper rounded-[18px] mt-4 px-4 py-3.5 flex flex-col gap-2">
        {rows.map(([label, text]) => (
          <p key={label} className="text-[13px] leading-relaxed">
            <span className="font-bold text-accent">{label}</span> {text}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {[`행운의 색 ${daily.lucky.color}`, `행운의 시간 ${daily.lucky.time}`, daily.lucky.action].map((c) => (
          <span key={c} className="text-xs bg-paper rounded-full px-3 py-1.5">{c}</span>
        ))}
      </div>
      <p className="text-[13px] mt-3">
        오늘 잘 맞는 유형{" "}
        {withMatchLink ? (
          <Link href={`/mbti/match?a=${type}&b=${daily.match}`} className="font-bold text-accent underline underline-offset-2">{daily.match}</Link>
        ) : (
          <span className="font-bold text-accent">{daily.match}</span>
        )}
      </p>
      <p className="text-[11px] text-muted mt-4 text-center">운명을 읽다 · unse-ai.com · 재미로 보는 운세</p>
    </article>
  );
}

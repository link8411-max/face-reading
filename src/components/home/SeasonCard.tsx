import Link from "next/link";
import { SEASON } from "@/content/season";

// 시즌 카드 (지금은 2027 신년운세). 시즌이 바뀌면 src/content/season.ts만 바꾼다.
export default function SeasonCard() {
  return (
    <section aria-label={SEASON.chip} className="bg-[#E6E8DF] rounded-[22px] p-5 flex items-center gap-3.5">
      <div className="flex-1">
        <p className="text-xs font-medium text-[#4F5A43]">{SEASON.chip}</p>
        <h2 className="font-serif font-bold text-[17px] leading-[1.4] mt-1.5 whitespace-pre-line">{SEASON.title}</h2>
        <p className="text-[13px] text-muted mt-1">{SEASON.sub}</p>
        <Link href={SEASON.cta.href} className="inline-flex items-center mt-3 h-11 px-5 rounded-full bg-ink text-paper text-sm font-medium">
          {SEASON.cta.label}
        </Link>
      </div>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="24" cy="32" r="16" fill="#FBF6F1" />
        <circle cx="40" cy="32" r="16" fill="#CFD6C4" />
        <path d="M32 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#A4553A" />
      </svg>
    </section>
  );
}

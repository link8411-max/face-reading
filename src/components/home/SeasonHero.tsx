import Link from "next/link";
import { SEASON } from "@/content/season";

export default function SeasonHero() {
  return (
    <section className="relative overflow-hidden rounded-[22px] p-5 text-white bg-gradient-to-br from-[#B8283A] via-[#D9573A] to-[#E5A23A] shadow-lg">
      <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/25">{SEASON.chip}</span>
      <h1 className="font-serif text-[26px] font-black leading-tight mt-2 whitespace-pre-line">{SEASON.title}</h1>
      <p className="text-sm opacity-90 mt-1.5">{SEASON.sub}</p>
      <Link href={SEASON.cta.href} className="inline-block mt-4 bg-white text-vermilion font-black text-sm px-4 py-2.5 rounded-full shadow">
        {SEASON.cta.label} →
      </Link>
      <span aria-hidden className="absolute -right-2 -bottom-3 text-[88px] leading-none">{SEASON.emoji}</span>
    </section>
  );
}

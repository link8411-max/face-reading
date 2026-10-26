import type { Metadata } from "next";
import Link from "next/link";
import { ZODIAC_SLUGS, zodiac2027, birthYears } from "@/content/fortune2027Zodiac";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";

export const metadata: Metadata = {
  title: `${FORTUNE_YEAR.year} 띠별 운세 | ${FORTUNE_YEAR.간지}년 12띠 신년운세 - 운명을 읽다`,
  description: `${FORTUNE_YEAR.year}년 ${FORTUNE_YEAR.간지}년(${FORTUNE_YEAR.한자}) 쥐띠부터 돼지띠까지 12띠 신년운세. 총운, 재물운, 연애운, 분기별 흐름과 잘 맞는 띠를 확인하세요.`,
  alternates: { canonical: "https://unse-ai.com/fortune/2027" },
  openGraph: {
    title: `${FORTUNE_YEAR.year} 띠별 운세 | 운명을 읽다`,
    description: `${FORTUNE_YEAR.간지}년 12띠 신년운세, 내 띠의 한 해 흐름을 확인하세요.`,
    url: "https://unse-ai.com/fortune/2027",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    images: [{ url: `/api/og?title=${encodeURIComponent(`${FORTUNE_YEAR.year} 띠별 운세`)}&subtitle=${encodeURIComponent(`${FORTUNE_YEAR.간지}년 12띠 신년운세`)}`, width: 1200, height: 630 }],
  },
};

export default function Zodiac2027Hub() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <header className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold">{FORTUNE_YEAR.year} 띠별 운세</h1>
          <p className="text-sm text-muted">{FORTUNE_YEAR.간지}년({FORTUNE_YEAR.한자}) · {FORTUNE_YEAR.특징}</p>
        </header>
        <p className="leading-relaxed">
          {FORTUNE_YEAR.year}년은 천간 정(丁)의 따뜻한 불 기운과 지지 미(未)의 너른 흙 기운이 만나는 정미년이에요. 띠마다 올해의 기운과 맺는 관계가 달라 한 해의 흐름도 저마다 달라요. 내 띠를 골라 총운, 재물운, 연애운, 분기별 흐름과 잘 맞는 띠를 확인해 보세요. 띠는 입춘(2월 4일 무렵)에 바뀌니, 1월 1일~2월 3일에 태어났다면 전년도 띠를 보세요.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ZODIAC_SLUGS.map((s) => {
            const z = zodiac2027[s];
            return (
              <Link key={s} href={`/fortune/2027/${s}`} className="bg-white rounded-[22px] border border-line p-4 hover:border-accent/50">
                <div className="font-serif font-bold text-lg">{z.띠}띠</div>
                <div className="text-xs text-muted">{birthYears(s).slice(-3).join(" · ")}년생</div>
              </Link>
            );
          })}
        </div>
        <Link href="/fortune" className="block text-center h-[52px] leading-[52px] bg-ink rounded-full font-medium text-paper">
          내 생년월일 사주로 자세히 보기
        </Link>
      </main>
    </div>
  );
}

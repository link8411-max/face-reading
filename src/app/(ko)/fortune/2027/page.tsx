import type { Metadata } from "next";
import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import ContentCta from "@/components/ContentCta";
import { ZODIAC_SLUGS, zodiac2027, birthYears } from "@/content/fortune2027Zodiac";
import { hubFaqs, samjaeSlugs, SAMJAE_LEAD, SAMJAE_LEAD_END, SAMJAE_TAIL, SAMJAE_NOTE } from "@/content/fortune2027Hub";
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

const h2 = "font-serif font-bold text-lg mb-2";

export default function Zodiac2027Hub() {
  const faqs = hubFaqs();
  const samjae = samjaeSlugs();
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "운명을 읽다", item: "https://unse-ai.com" },
        { "@type": "ListItem", position: 2, name: `${FORTUNE_YEAR.year} 띠별 운세`, item: "https://unse-ai.com/fortune/2027" },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <header className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold">{FORTUNE_YEAR.year} 띠별 운세</h1>
          <p className="text-sm text-muted">{FORTUNE_YEAR.간지}년({FORTUNE_YEAR.한자}) · {FORTUNE_YEAR.특징}</p>
        </header>
        <section>
          <h2 className={h2}>{FORTUNE_YEAR.year}년 {FORTUNE_YEAR.간지}년이란?</h2>
          <p className="leading-relaxed">
          {FORTUNE_YEAR.year}년은 천간 정(丁)의 따뜻한 불 기운과 지지 미(未)의 너른 흙 기운이 만나는 정미년이에요. 띠마다 올해의 기운과 맺는 관계가 달라 한 해의 흐름도 저마다 달라요. 내 띠를 골라 총운, 재물운, 연애운, 분기별 흐름과 잘 맞는 띠를 확인해 보세요. 띠는 입춘(2월 4일 무렵)에 바뀌니, 1월 1일~2월 3일에 태어났다면 전년도 띠를 보세요.
        </p>
          <p className="leading-relaxed mt-3">
            정(丁)은 불의 기운이라 붉은색, 미(未)는 양이라 &ldquo;붉은 양의 해&rdquo;라고 불러요.
          </p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          {ZODIAC_SLUGS.map((s) => {
            const z = zodiac2027[s];
            return (
              <Link key={s} href={`/fortune/2027/${s}`} className="bg-card rounded-[22px] border border-line p-4 hover:border-accent/50">
                <div className="font-serif font-bold text-lg">{z.띠}띠</div>
                <div className="text-xs text-muted">{birthYears(s).slice(-3).join(" · ")}년생</div>
              </Link>
            );
          })}
        </div>
        <section>
          <h2 className={h2}>12띠 한눈에 비교</h2>
          <div className="overflow-x-auto rounded-[22px] border border-line bg-card">
            <table className="w-full text-sm">
              <caption className="caption-top text-left text-xs text-muted px-3 py-2">{FORTUNE_YEAR.year} {FORTUNE_YEAR.간지}년 12띠 한 줄 비교</caption>
              <thead>
                <tr className="bg-card-2 text-muted text-left">
                  <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">띠</th>
                  <th scope="col" className="px-3 py-2 font-medium">올해의 관계</th>
                  <th scope="col" className="px-3 py-2 font-medium">한 줄 요약</th>
                </tr>
              </thead>
              <tbody>
                {ZODIAC_SLUGS.map((s) => {
                  const z = zodiac2027[s];
                  return (
                    <tr key={s} className="border-t border-line align-top">
                      <th scope="row" className="px-3 py-2 text-left font-normal whitespace-nowrap">
                        <Link href={`/fortune/2027/${s}`} className="font-bold text-accent-ink">{z.띠}띠</Link>
                        <div className="text-xs text-muted">{birthYears(s).slice(-2).join("·")}년생</div>
                      </th>
                      <td className="px-3 py-2">{z.올해관계}</td>
                      <td className="px-3 py-2 leading-relaxed">{z.한줄}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className={h2}>{FORTUNE_YEAR.year}년 삼재띠는?</h2>
          <p className="leading-relaxed">
            {SAMJAE_LEAD}
            {samjae.map((s, i) => (
              <span key={s}>
                {i > 0 && "·"}
                <Link href={`/fortune/2027/${s}`} className="font-bold text-accent-ink">{zodiac2027[s].띠}띠</Link>
              </span>
            ))}
            {SAMJAE_LEAD_END} {SAMJAE_TAIL} {SAMJAE_NOTE}
          </p>
          <p className="mt-3">
            <Link href="/bujeok?wish=samjae" className="font-bold text-accent-ink">삼재 막이 부적 만들기</Link>
          </p>
        </section>
        <ContentCta href="/face2" title="띠 운세 봤으면 내 얼굴 관상도?" desc="사진 한 장이면 관상 풀이가 1분 안에 나와요. 사진은 저장하지 않아요." label="내 관상 보기" />
        <section>
          <h2 className={h2}>자주 묻는 질문</h2>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="bg-card rounded-[18px] border border-line px-4 py-3">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
        <Link href="/fortune" className="block text-center h-[52px] leading-[52px] bg-accent rounded-full font-medium text-white">
          내 생년월일 사주로 자세히 보기
        </Link>
        <CoupangBanner subId="fortune-2027" />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}

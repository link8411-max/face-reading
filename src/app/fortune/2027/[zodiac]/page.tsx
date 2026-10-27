import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Zodiac2027Article from "@/components/Zodiac2027Article";
import { SAMJAE_2027, ZODIAC_SLUGS, keyword2027, titleYears, zodiac2027, type ZodiacSlug } from "@/content/fortune2027Zodiac";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";

export const dynamicParams = false;

export function generateStaticParams() {
  return ZODIAC_SLUGS.map((zodiac) => ({ zodiac }));
}

const isSlug = (s: string): s is ZodiacSlug => (ZODIAC_SLUGS as readonly string[]).includes(s);

export async function generateMetadata({ params }: { params: Promise<{ zodiac: string }> }): Promise<Metadata> {
  const { zodiac } = await params;
  if (!isSlug(zodiac)) return {};
  const z = zodiac2027[zodiac];
  const samjae = SAMJAE_2027[zodiac];
  // 검색 제목: 출생연도·날삼재(또는 올해 키워드)를 앞에, 브랜드는 끝에 짧게 (tests/seo-snippets.test.tsx)
  const title = `${FORTUNE_YEAR.year} ${z.띠}띠 운세 (${titleYears(zodiac)}년생) ${samjae ? `${samjae}·총운` : `${keyword2027(zodiac)}의 해`} – 운명을 읽다`;
  const description = `${samjae ? `${samjae}인 ` : ""}${z.띠}띠의 ${FORTUNE_YEAR.year} ${FORTUNE_YEAR.간지}년 총운·재물·연애·직장운과 분기 흐름. ${z.한줄}`;
  const url = `https://unse-ai.com/fortune/2027/${zodiac}`;
  return {
    title,
    description,
    keywords: `${FORTUNE_YEAR.year}년 ${z.띠}띠 운세, ${FORTUNE_YEAR.year} ${z.띠}띠, ${z.띠}띠 신년운세, ${FORTUNE_YEAR.간지}년 ${z.띠}띠, 띠별 운세`,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "article", locale: "ko_KR", siteName: "운명을 읽다",
      images: [{ url: `/api/og?title=${encodeURIComponent(`${FORTUNE_YEAR.year}년 ${z.띠}띠 운세`)}&subtitle=${encodeURIComponent(`${FORTUNE_YEAR.간지}년 띠별 신년운세`)}`, width: 1200, height: 630 }],
    },
  };
}

export default async function ZodiacPage({ params }: { params: Promise<{ zodiac: string }> }) {
  const { zodiac } = await params;
  if (!isSlug(zodiac)) notFound();
  return <Zodiac2027Article slug={zodiac} />;
}

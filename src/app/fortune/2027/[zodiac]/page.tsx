import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Zodiac2027Article from "@/components/Zodiac2027Article";
import { ZODIAC_SLUGS, zodiac2027, type ZodiacSlug } from "@/content/fortune2027Zodiac";
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
  const title = `${FORTUNE_YEAR.year}년 ${z.띠}띠 운세 | ${FORTUNE_YEAR.간지}년 띠별 신년운세 - 운명을 읽다`;
  const url = `https://unse-ai.com/fortune/2027/${zodiac}`;
  return {
    title,
    description: `${FORTUNE_YEAR.year}년 ${z.띠}띠 총운·재물운·연애운·직장운·건강운과 분기별 흐름, 잘 맞는 띠까지. ${z.한줄}`,
    keywords: `${FORTUNE_YEAR.year}년 ${z.띠}띠 운세, ${FORTUNE_YEAR.year} ${z.띠}띠, ${z.띠}띠 신년운세, ${FORTUNE_YEAR.간지}년 ${z.띠}띠, 띠별 운세`,
    alternates: { canonical: url },
    openGraph: {
      title, description: z.한줄, url, type: "article", locale: "ko_KR", siteName: "운명을 읽다",
      images: [{ url: `/api/og?title=${encodeURIComponent(`${FORTUNE_YEAR.year}년 ${z.띠}띠 운세`)}&subtitle=${encodeURIComponent(`${FORTUNE_YEAR.간지}년 띠별 신년운세`)}&icon=${encodeURIComponent(z.이모지)}`, width: 1200, height: 630 }],
    },
  };
}

export default async function ZodiacPage({ params }: { params: Promise<{ zodiac: string }> }) {
  const { zodiac } = await params;
  if (!isSlug(zodiac)) notFound();
  return <Zodiac2027Article slug={zodiac} />;
}

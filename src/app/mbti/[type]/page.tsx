import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MbtiArticle from "@/components/mbti/MbtiArticle";
import { mbtiProfiles, MBTI_SLUGS } from "@/content/mbtiTypes";
import { isMbti } from "@/lib/mbti/compat";

export const dynamicParams = false;
// 이달의 운세가 달이 바뀐 뒤에도 서버 HTML에 맞게 나오도록 하루마다 다시 만든다
export const revalidate = 86400;

export function generateStaticParams() {
  return MBTI_SLUGS.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const T = type.toUpperCase();
  if (!isMbti(T)) return {};
  const p = mbtiProfiles[T];
  const title = `${T} ${p.nickname} — 궁합·연애·여행지·직업 – 운명을 읽다`;
  const description = `${T}와 잘 맞는 MBTI, 연애 스타일, 어울리는 여행지와 직업까지. ${p.summary.slice(0, 60)}…`;
  const url = `https://unse-ai.com/mbti/${type}`;
  return {
    title, description,
    keywords: `${T}, ${T} 궁합, ${T} 연애, ${T} 직업, ${T} 여행, MBTI 궁합`,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "article", locale: "ko_KR", siteName: "운명을 읽다",
      images: [{ url: `/api/og?title=${encodeURIComponent(`${T} ${p.nickname}`)}&subtitle=${encodeURIComponent("MBTI 궁합·연애·직업")}`, width: 1200, height: 630 }],
    },
  };
}

export default async function MbtiTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const T = type.toUpperCase();
  if (!isMbti(T) || type !== type.toLowerCase()) notFound();
  return <MbtiArticle type={T} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MbtiArticle from "@/components/mbti/MbtiArticle";
import { mbtiOgPath, mbtiProfiles, mbtiUrl, MBTI_SLUGS } from "@/content/mbtiTypes";
import { bestMatches, isMbti } from "@/lib/mbti/compat";

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
  const best = bestMatches(T, "love", 1)[0];
  const title = `${p.nickname} ${T} 특징·궁합 1위 ${best} – 운명을 읽다`;
  const description = `${p.nickname} ${T}와 연애로 잘 맞는 유형 1위는 ${best}. 친구·직장 궁합과 어울리는 직업, 여행지까지 정리했어요.`;
  const url = mbtiUrl(T);
  return {
    title, description,
    keywords: `${T}, ${T} 궁합, ${T} 연애, ${T} 직업, ${T} 여행, MBTI 궁합`,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "article", locale: "ko_KR", siteName: "운명을 읽다",
      images: [{ url: mbtiOgPath(T), width: 1200, height: 630 }],
    },
  };
}

export default async function MbtiTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const T = type.toUpperCase();
  if (!isMbti(T) || type !== type.toLowerCase()) notFound();
  return <MbtiArticle type={T} />;
}

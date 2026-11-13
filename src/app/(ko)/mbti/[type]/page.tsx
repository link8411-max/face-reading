import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MbtiArticle from "@/components/mbti/MbtiArticle";
import { mbtiOgPath, mbtiProfiles, mbtiUrl, MBTI_SLUGS } from "@/content/mbtiTypes";
import { bestMatches, isMbti } from "@/lib/mbti/compat";

export const dynamicParams = false;
// 이달의 운세가 달이 바뀐 뒤에도 서버 HTML에 맞게 나오도록 하루마다 다시 만든다
export const revalidate = 86400;

// 검색 제목 실험(2026-11-11): 네이버 노출 상위인데 클릭률이 낮은 세 유형만 유형 코드를 앞에 두고 설명에 주변 평을 넣었다.
// 비교 기준(서치어드바이저 최근 30일): ESFP 노출 841·0.8%, ISFJ 542·2.6%, ISFP 375·0.8%. 나머지 13유형은 그대로 두고 대조군으로 본다.
const MBTI_HOOK_TYPES = new Set(["ESFP", "ISFJ", "ISFP"]);

export function generateStaticParams() {
  return MBTI_SLUGS.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const T = type.toUpperCase();
  if (!isMbti(T)) return {};
  const p = mbtiProfiles[T];
  const best = bestMatches(T, "love", 1)[0];
  const hook = MBTI_HOOK_TYPES.has(T);
  const heard = p.summary.match(/주변에서는 "([^"]+)"/)?.[1];
  const title = hook ? `${T} ${p.nickname} 특징 | 찰떡 궁합 ${best}·직업 – 운명을 읽다` : `${p.nickname} ${T} 특징·궁합 1위 ${best} – 운명을 읽다`;
  const description = hook && heard
    ? `"${heard}" 소리 자주 듣는 ${T}. 연애로 잘 맞는 1위는 ${best}, 친구·직장 궁합과 어울리는 직업까지 정리했어요.`
    : `${p.nickname} ${T}와 연애로 잘 맞는 유형 1위는 ${best}. 친구·직장 궁합과 어울리는 직업, 여행지까지 정리했어요.`;
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

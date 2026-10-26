import type { Metadata } from "next";
import MatchCalculator from "@/components/mbti/MatchCalculator";
import CoupangBanner from "@/components/CoupangBanner";
import { mbtiShared, SITE } from "@/lib/shareLinks";

const BASE: Metadata = {
  title: "MBTI 궁합 계산기 — 연애·친구·직장 궁합 점수 | 운명을 읽다",
  description: "나와 상대의 MBTI를 고르면 연애·친구·직장 궁합 점수와 잘 맞는 이유를 알려 드려요. 결과 이미지로 저장해 공유해 보세요.",
  alternates: { canonical: "https://unse-ai.com/mbti/match" },
  openGraph: { title: "MBTI 궁합 계산기 | 운명을 읽다", description: "두 MBTI의 궁합 점수를 확인해 보세요.", url: "https://unse-ai.com/mbti/match", type: "website", locale: "ko_KR", siteName: "운명을 읽다" },
};

type Search = Promise<{ a?: string | string[]; b?: string | string[] }>;
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";

// 친구가 보낸 궁합 링크(?a=&b=)면 결과 문구로 미리보기를 만든다 (검색 제외, canonical은 계산기)
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const q = await searchParams;
  const m = mbtiShared(one(q.a).toUpperCase(), one(q.b).toUpperCase());
  if (!m) return BASE;
  const image = `${SITE}/api/og/result?kind=mbti&a=${m.a}&b=${m.b}`;
  const description = "두 MBTI를 고르면 연애·친구·직장 궁합 점수를 알려 드려요.";
  return {
    title: `${m.phrase} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/mbti/match` },
    openGraph: { title: m.phrase, description, url: `${SITE}/mbti/match`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: m.phrase }] },
    twitter: { card: "summary_large_image", title: m.phrase, description, images: [image] },
  };
}

export default function MatchPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="font-serif text-3xl font-bold">MBTI 궁합 계산기</h1>
        <p className="text-sm text-muted mt-1">두 유형을 고르면 연애·친구·직장 궁합 점수와 잘 맞는 이유를 알려 드려요.</p>
      </header>
      <MatchCalculator />
      <CoupangBanner subId="mbti-match" />
    </div>
  );
}

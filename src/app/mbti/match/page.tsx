import type { Metadata } from "next";
import MatchCalculator from "@/components/mbti/MatchCalculator";
import CoupangBanner from "@/components/CoupangBanner";

export const metadata: Metadata = {
  title: "MBTI 궁합 계산기 — 연애·친구·직장 궁합 점수 | 운명을 읽다",
  description: "나와 상대의 MBTI를 고르면 연애·친구·직장 궁합 점수와 잘 맞는 이유를 알려 드려요. 결과 이미지로 저장해 공유해 보세요.",
  alternates: { canonical: "https://unse-ai.com/mbti/match" },
  openGraph: { title: "MBTI 궁합 계산기 | 운명을 읽다", description: "두 MBTI의 궁합 점수를 확인해 보세요.", url: "https://unse-ai.com/mbti/match", type: "website", locale: "ko_KR", siteName: "운명을 읽다" },
};

export default function MatchPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="font-serif text-3xl font-black text-vermilion">MBTI 궁합 계산기</h1>
        <p className="text-sm text-muted mt-1">두 유형을 고르면 연애·친구·직장 궁합 점수와 잘 맞는 이유를 알려 드려요.</p>
      </header>
      <MatchCalculator />
      <CoupangBanner subId="mbti-match" />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

// MBTI(5단계) 전까지 준비 중 페이지 — 검색 노출 제외
export const metadata: Metadata = {
  title: "MBTI 궁합 준비 중 | 운명을 읽다",
  description: "MBTI 궁합과 16유형별 운세·여행지·직업을 준비하고 있어요.",
  robots: { index: false, follow: true },
};

export default function MbtiComingSoon() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4" aria-hidden>🧩</div>
      <h1 className="font-serif text-3xl font-black text-vermilion">MBTI 궁합, 곧 열려요</h1>
      <p className="text-muted leading-relaxed mt-3">
        16유형별 궁합과 이달의 운세, 나랑 맞는 여행지와 직업을 준비하고 있어요.
      </p>
      <p className="inline-block mt-4 text-xs font-bold px-3 py-1 rounded-full bg-vermilion/10 text-vermilion">준비 중이에요</p>
      <h2 className="text-sm font-bold text-ink mt-10 mb-3">그동안 이런 테스트는 어때요?</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/face-tests" className="bg-white border border-line rounded-2xl py-4 font-bold">👤 얼굴 테스트</Link>
        <Link href="/unse" className="bg-white border border-line rounded-2xl py-4 font-bold">☯ 운세·사주</Link>
      </div>
    </div>
  );
}

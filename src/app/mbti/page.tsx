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
    <main className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="text-6xl mb-4" aria-hidden>🧩</div>
      <h1 className="font-serif text-3xl font-black text-vermilion">MBTI 궁합, 곧 열려요</h1>
      <p className="text-muted leading-relaxed mt-3">
        16유형별 궁합과 이달의 운세, 나랑 맞는 여행지와 직업을 준비하고 있어요. 그동안 다른 테스트를 해 보세요.
      </p>
      <div className="grid grid-cols-2 gap-3 mt-8">
        <Link href="/face-tests" className="bg-white border border-line rounded-2xl py-4 font-bold">👤 얼굴 테스트</Link>
        <Link href="/unse" className="bg-white border border-line rounded-2xl py-4 font-bold">☯ 운세·사주</Link>
      </div>
    </main>
  );
}

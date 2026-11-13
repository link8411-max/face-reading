import type { Metadata } from "next";
import FaceMatchClient from "@/components/faceMatch/FaceMatchClient";

export const metadata: Metadata = {
  title: "얼굴 궁합 테스트 — 친구·연인·짝사랑 궁합 | 운명을 읽다",
  description: "두 사람 얼굴 사진으로 보는 친구·연인·짝사랑 궁합. 동물상으로 궁합 점수와 잘 맞는 이유를 알려 드려요. 사진은 저장되지 않아요.",
  keywords: "얼굴 궁합, 관상 궁합, 짝사랑 궁합, 커플 궁합, 친구 궁합, 동물상 궁합",
  alternates: { canonical: "https://unse-ai.com/face-match" },
  openGraph: { title: "얼굴 궁합 테스트 | 운명을 읽다", description: "친구·연인·짝사랑, 두 얼굴의 궁합은 몇 점일까?", url: "https://unse-ai.com/face-match", type: "website", locale: "ko_KR", siteName: "운명을 읽다", images: [{ url: "/api/og?title=얼굴%20궁합&subtitle=친구·연인·짝사랑%20궁합은%20몇%20점?", width: 1200, height: 630 }] },
};

export default function FaceMatchPage() {
  return (
    <main className="mx-auto px-[22px] max-w-lg">
      <header className="pt-5 pb-1">
        <h1 className="text-sm font-medium text-center">얼굴 궁합 테스트</h1>
      </header>
      <h2 className="mt-4 font-serif font-bold text-[27px] leading-[1.4] break-keep">우리 둘,<br />얼굴 궁합은 몇 점?</h2>
      <p className="mt-2.5 mb-5 text-sm text-muted leading-relaxed">두 사람의 얼굴로 동물상을 찾아 친구·연인·짝사랑 궁합을 알려 드려요.</p>
      <FaceMatchClient />
    </main>
  );
}

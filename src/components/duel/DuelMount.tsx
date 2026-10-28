"use client";

import "./duel.css";
import dynamic from "next/dynamic";
import TestHeader from "@/components/test/TestHeader";
import { useBackOrHome } from "@/hooks/useBackOrHome";

// Phaser는 브라우저에서만 돈다 → 게임 화면은 서버에서 그리지 않는다
const DuelClient = dynamic(() => import("./DuelClient"), {
  ssr: false,
  loading: () => (
    <div className="relative w-[320px] max-w-full mx-auto bg-cloth grid place-items-center" style={{ aspectRatio: "4 / 3" }}>
      <p className="text-sm text-paper">일기토를 준비하는 중…</p>
    </div>
  ),
});

// 게임 영역: 화면 높이만큼 캔버스와 같은 천 무늬(웹 페이지 위에 얹힌 작은 카드로 보이지 않게)
export default function DuelMount() {
  const goBack = useBackOrHome();
  return (
    <section className="duel-cloth min-h-[100dvh] pb-8">
      <div className="mx-auto px-4 max-w-lg">
        <TestHeader title="삼국지 일기토" onBack={goBack} backLabel="돌아가기" tone="dark" />
      </div>
      <DuelClient />
    </section>
  );
}

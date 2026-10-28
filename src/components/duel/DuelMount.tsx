"use client";

import dynamic from "next/dynamic";
import TestHeader from "@/components/test/TestHeader";
import { useBackOrHome } from "@/hooks/useBackOrHome";

// Phaser는 브라우저에서만 돈다 → 게임 화면은 서버에서 그리지 않는다
const DuelClient = dynamic(() => import("./DuelClient"), {
  ssr: false,
  loading: () => (
    <div className="relative w-full max-w-[480px] mx-auto rounded-sm bg-ink grid place-items-center" style={{ aspectRatio: "4 / 3" }}>
      <p className="text-sm text-paper">일기토를 준비하는 중…</p>
    </div>
  ),
});

export default function DuelMount() {
  const goBack = useBackOrHome();
  return (
    <>
      <TestHeader title="삼국지 일기토" onBack={goBack} backLabel="돌아가기" />
      <div className="max-w-[480px] mx-auto">
        <DuelClient />
      </div>
    </>
  );
}

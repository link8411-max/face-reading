"use client";

import { Icon } from "@/components/icons";

// 테스트 페이지 머리: 뒤로(입력 화면) 또는 다시하기(결과 화면) + 페이지 이름(h1)
export default function TestHeader({ title, onBack, backLabel }: { title: string; onBack: () => void; backLabel: "돌아가기" | "다시하기" }) {
  return (
    <header className="flex items-center justify-between h-16">
      <button type="button" onClick={onBack} aria-label={backLabel} className="w-11 h-11 -ml-2.5 grid place-items-center text-ink">
        <Icon name="back" />
      </button>
      <h1 className="text-sm font-medium">{title}</h1>
      <span className="w-11" aria-hidden />
    </header>
  );
}

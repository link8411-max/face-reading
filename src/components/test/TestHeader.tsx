"use client";

import { Icon } from "@/components/icons";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";

// 테스트 페이지 머리: 뒤로(입력 화면) 또는 다시하기(결과 화면) + 페이지 이름(h1)
// tone="dark": 어두운 바탕(일기토 천) 위에서 밝은 글씨
export default function TestHeader({ title, onBack, backLabel, tone = "light", language = true }: { title: string; onBack: () => void; backLabel: string; tone?: "light" | "dark"; language?: boolean }) {
  const fg = tone === "dark" ? "text-ink" : "text-ink";
  return (
    <header className={`flex items-center justify-between h-16 ${tone === "dark" ? "text-ink" : ""}`}>
      <div className="w-[92px]">
        <button type="button" onClick={onBack} aria-label={backLabel} className={`w-11 h-11 -ml-2.5 grid place-items-center ${fg}`}>
          <Icon name="back" />
        </button>
      </div>
      <h1 className="text-sm font-medium">{title}</h1>
      <div className={`w-[92px] flex justify-end -mr-2 ${fg}`}>
        {language && <LanguageSwitch />}
      </div>
    </header>
  );
}

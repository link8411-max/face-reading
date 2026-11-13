"use client";

import { Icon } from "@/components/icons";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import CastHero from "@/components/cast/CastHero";
import type { CastKey } from "@/content/cast";
import type { LineKey } from "@/content/castLines";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// 테스트 페이지 머리: 뒤로(입력 화면) 또는 다시하기(결과 화면) + 페이지 이름(h1)
// tone="dark": 어두운 바탕(일기토 천) 위에서 밝은 글씨
// cast: 시작 화면에서만 준다. 머리 아래에 캐릭터 큰 그림(16:10)과 말풍선이 깔린다. 결과 화면에서는 주지 않는다.
export default function TestHeader({ title, onBack, backLabel, tone = "light", language = true, cast }: { title: string; onBack: () => void; backLabel: string; tone?: "light" | "dark"; language?: boolean; cast?: { cast: CastKey; line: LineKey } }) {
  const fg = tone === "dark" ? "text-ink" : "text-ink";
  const locale = useLocale();
  return (
    <>
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
    {cast && <CastHero cast={cast.cast} lineKey={cast.line} locale={locale} />}
    </>
  );
}

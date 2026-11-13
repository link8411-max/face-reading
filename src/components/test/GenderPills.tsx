"use client";

import { useT } from "@/lib/i18n/LocaleProvider";

export type Gender = "여" | "남";

// 성별 선택 (여자/남자 pill). 얼굴 기준값을 성별별로 쓰므로 테스트 시작 전에 필수로 고른다.
export default function GenderPills({ value, onChange, label, disabled }: { value: Gender | null; onChange: (g: Gender) => void; label?: string; disabled?: boolean }) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={label ?? t("gender.aria")} className="grid grid-cols-2 gap-2">
      {(["여", "남"] as const).map((g) => {
        const on = value === g;
        return (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(g)}
            className={`h-12 rounded-full border text-[15px] font-medium transition disabled:opacity-60 ${on ? "bg-ink text-paper border-ink" : "bg-card text-ink border-line"}`}
          >
            {g === "여" ? t("gender.female") : t("gender.male")}
          </button>
        );
      })}
    </div>
  );
}

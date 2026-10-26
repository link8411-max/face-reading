"use client";

export type Gender = "여" | "남";

// 성별 선택 (여자/남자 pill). 얼굴 기준값을 성별별로 쓰므로 테스트 시작 전에 필수로 고른다.
export default function GenderPills({ value, onChange }: { value: Gender | null; onChange: (g: Gender) => void }) {
  return (
    <div role="radiogroup" aria-label="성별" className="grid grid-cols-2 gap-2">
      {(["여", "남"] as const).map((g) => {
        const on = value === g;
        return (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(g)}
            className={`h-12 rounded-full border text-[15px] font-medium transition ${on ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line"}`}
          >
            {g === "여" ? "여자" : "남자"}
          </button>
        );
      })}
    </div>
  );
}

import type { SajuResult } from "@/lib/saju/engine";

const ROWS = [
  { key: "year", label: "년주" },
  { key: "month", label: "월주" },
  { key: "day", label: "일주" },
  { key: "hour", label: "시주" },
] as const;

// 네 기둥 표: 년·월·일·시 순서(왼쪽→오른쪽), 윗줄 천간·아랫줄 지지, 한자는 크게 한글은 작게
export default function SajuTable({ pillars }: { pillars: SajuResult["pillars"] }) {
  return (
    <div className="grid grid-cols-4 gap-2" role="table" aria-label="사주 네 기둥">
      {ROWS.map(({ key, label }) => {
        const p = pillars[key];
        const isDay = key === "day";
        return (
          <div key={key} role="rowgroup" className={`rounded-2xl border py-3 text-center ${isDay ? "bg-card border-accent" : "bg-card-2 border-line"}`}>
            <p className="text-[11px] text-muted">{label}</p>
            {p ? (
              <>
                <div className="mt-2">
                  <p className="font-serif text-[22px] leading-none" lang="zh">{p.hanja[0]}</p>
                  <p className="mt-1 text-[11px] text-muted">{p.stem}</p>
                </div>
                <div className="mt-2.5">
                  <p className="font-serif text-[22px] leading-none" lang="zh">{p.hanja[1]}</p>
                  <p className="mt-1 text-[11px] text-muted">{p.branch}</p>
                </div>
              </>
            ) : (
              <p className="mt-6 mb-5 text-sm text-muted">모름</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

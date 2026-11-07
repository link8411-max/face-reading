import type { SajuResult } from "@/lib/saju/engine";

// 대운 8칸: 가로로 넘겨 본다. 지금 대운은 강조
export default function DaeunTimeline({ daeun }: { daeun: SajuResult["daeun"] }) {
  if (daeun.length === 0) return null;
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <ul className="flex gap-2 px-1">
        {daeun.slice(0, 8).map((d) => (
          <li
            key={d.startAge}
            aria-current={d.isCurrent ? "true" : undefined}
            className={`shrink-0 w-[92px] rounded-2xl border px-2 py-3 text-center ${d.isCurrent ? "bg-card border-accent" : "bg-card-2 border-line"}`}
          >
            <p className="font-serif text-[22px] leading-none" lang="zh">{d.hanja}</p>
            <p className="mt-1 text-[11px] text-muted">{d.korean}</p>
            <p className="mt-2 text-xs font-medium">만 {d.startAge}세부터</p>
            <p className="text-[10px] text-muted">세는 나이 {d.countingAge}세</p>
            {d.isCurrent && <p className="mt-1 text-[10px] text-accent font-bold">지금</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { TEN_GOD_COPY, daeunCopy, nextDaeunCopy, tenGodOfStem } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";
import type { Stem } from "@/lib/saju/keys";

// 10년 흐름 8칸: 가로로 넘겨 본다. 나이 범위를 크게, 따옴표 한 줄을 작게, 한자는 아주 작고 흐리게. 지금 구간은 강조하고 아래에 풀이를 붙인다
export default function DaeunTimeline({ daeun, dayStem }: { daeun: SajuResult["daeun"]; dayStem: Stem }) {
  if (daeun.length === 0) return null;
  const items = daeun.slice(0, 8).map((d) => ({ d, tenGod: tenGodOfStem(dayStem, d.korean[0] as Stem) }));
  const cur = items.find((i) => i.d.isCurrent);
  const curCopy = cur ? daeunCopy({ countingAge: cur.d.countingAge, korean: cur.d.korean, tenGod: cur.tenGod }) : null;
  const next = cur ? items[items.indexOf(cur) + 1] : undefined;
  const nextCopy = next ? nextDaeunCopy({ countingAge: next.d.countingAge, korean: next.d.korean, tenGod: next.tenGod }) : null;
  return (
    <div>
      <div className="-mx-1 overflow-x-auto pb-1">
        <ul className="flex gap-2 px-1">
          {items.map(({ d, tenGod }) => (
            <li
              key={d.startAge}
              aria-current={d.isCurrent ? "true" : undefined}
              className={`shrink-0 w-[104px] rounded-2xl border px-2 py-3 text-center ${d.isCurrent ? "bg-card border-accent" : "bg-card-2 border-line"}`}
            >
              <p className="text-base font-bold leading-none">{d.countingAge}~{d.countingAge + 9}세</p>
              <p className="mt-2 text-[11px] leading-snug break-keep">&lsquo;{TEN_GOD_COPY[tenGod].period}&rsquo;</p>
              <p className="mt-2 text-[10px] text-muted" lang="zh">{d.hanja}</p>
              {d.isCurrent && <p className="mt-1 text-[10px] text-accent-ink font-bold">지금</p>}
            </li>
          ))}
        </ul>
      </div>
      {curCopy && (
        <div className="mt-3 px-1">
          <p className="text-sm leading-relaxed">{curCopy.text}</p>
          <p className="mt-1 text-[11px] text-muted">{curCopy.basis}</p>
          {nextCopy && (
            <>
              <p className="mt-2.5 text-sm leading-relaxed">{nextCopy.text}</p>
              <p className="mt-1 text-[11px] text-muted">{nextCopy.basis}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

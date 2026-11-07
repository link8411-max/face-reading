import { TEN_GOD_COPY, evidenceTail } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";

// 십신은 많은 순 둘만 보여 준다 (없는 십신은 표시하지 않음)
export default function TenGodSummary({ tenGods }: { tenGods: SajuResult["tenGods"] }) {
  return (
    <ul className="space-y-3">
      {tenGods.top.slice(0, 2).map((g) => (
        <li key={g} className="text-sm leading-relaxed">
          <p>
            <strong className="font-bold">{TEN_GOD_COPY[g].easy}</strong>{" "}
            <span className="text-[11px] text-muted">{g}</span>
          </p>
          <p className="mt-0.5 text-muted">
            {evidenceTail(g, tenGods.counts[g])} {TEN_GOD_COPY[g].many}
          </p>
        </li>
      ))}
    </ul>
  );
}

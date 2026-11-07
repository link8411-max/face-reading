import { TEN_GOD_COPY, tenGodBasis } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";

// 십신은 많은 순 둘만 보여 준다 (없는 십신은 표시하지 않음). 본문은 쉬운 말, 전통 이름은 회색 꼬리 줄
export default function TenGodSummary({ tenGods }: { tenGods: SajuResult["tenGods"] }) {
  return (
    <ul className="space-y-3">
      {tenGods.top.slice(0, 2).map((g) => (
        <li key={g} className="text-sm leading-relaxed">
          <p className="font-bold">{TEN_GOD_COPY[g].label}</p>
          <p className="mt-0.5">{TEN_GOD_COPY[g].text}</p>
          <p className="mt-1 text-[11px] text-muted">{tenGodBasis(g, tenGods.counts[g])}</p>
        </li>
      ))}
    </ul>
  );
}

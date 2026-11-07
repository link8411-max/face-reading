import { areaReadings } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";

// 연애·일·돈·사람 네 줄: 가장 많은 십신 무리로 고른다(같으면 태어난 달 기준). 전통 이름은 회색 꼬리 줄에만
export default function AreaLines({ tenGods }: { tenGods: SajuResult["tenGods"] }) {
  const r = areaReadings(tenGods.counts, tenGods.byPillar.month);
  return (
    <div>
      <ul className="space-y-2.5">
        {r.lines.map((l) => (
          <li key={l.key} className="flex gap-3 text-sm leading-relaxed">
            <span className="shrink-0 w-9 h-6 rounded-full bg-card-2 text-accent text-xs font-bold grid place-items-center">{l.label}</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted">{r.basis}</p>
    </div>
  );
}

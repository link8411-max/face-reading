import { ELEMENTS } from "@/lib/saju/keys";
import { ELEMENT_COPY } from "@/content/saju";
import type { Element } from "@/lib/saju/keys";

const HANJA: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

// 오행 다섯 막대: 쉬운 이름 + 전통 한자, 개수, 막대 길이는 개수/전체
export default function ElementBars({ elements }: { elements: Record<Element, number> }) {
  const total = ELEMENTS.reduce((a, e) => a + elements[e], 0) || 1;
  return (
    <ul className="space-y-2">
      {ELEMENTS.map((e) => (
        <li key={e} className="flex items-center gap-3 text-sm">
          <span className="w-[88px] shrink-0">
            {ELEMENT_COPY[e].easy} <span className="text-[11px] text-muted" lang="zh">{HANJA[e]}</span>
          </span>
          <span className="flex-1 h-2.5 rounded-full bg-card-2 overflow-hidden">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(elements[e] / total) * 100}%` }} />
          </span>
          <span className="w-5 text-right tabular-nums">{elements[e]}</span>
        </li>
      ))}
    </ul>
  );
}

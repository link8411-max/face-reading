import { ELEMENTS } from "@/lib/saju/keys";
import { ELEMENT_COPY, elementSummary } from "@/content/saju";
import type { Element } from "@/lib/saju/keys";

// 오행 다섯 막대: 쉬운 이름 + 전통 한자, 개수, 막대 길이는 개수/전체
export default function ElementBars({ elements }: { elements: Record<Element, number> }) {
  const total = ELEMENTS.reduce((a, e) => a + elements[e], 0) || 1;
  const summary = elementSummary(elements);
  return (
    <div>
    <ul className="space-y-2">
      {ELEMENTS.map((e) => (
        <li key={e} className="flex items-center gap-3 text-sm">
          <span className="w-[88px] shrink-0">
            {ELEMENT_COPY[e].easy} <span className="text-[11px] text-muted" lang="zh">{ELEMENT_COPY[e].hanja}</span>
          </span>
          <span className="flex-1 h-2.5 rounded-full bg-card-2 overflow-hidden">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(elements[e] / total) * 100}%` }} />
          </span>
          <span className="w-5 text-right tabular-nums">{elements[e]}</span>
        </li>
      ))}
    </ul>
    <p className="mt-3 text-sm leading-relaxed">{summary.text}</p>
    <p className="mt-1 text-[11px] text-muted">{summary.basis}</p>
    </div>
  );
}

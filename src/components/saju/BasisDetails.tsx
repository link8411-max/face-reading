import { BASIS_COPY, TRUST_COPY } from "@/content/saju";
import type { SajuResult } from "@/lib/saju/engine";

export function boundaryText(b: NonNullable<SajuResult["basis"]["boundaryWarning"]>): string {
  return b.kind === "jeolip" ? BASIS_COPY.boundaryJeolip(b.at, b.alt) : BASIS_COPY.boundaryMidnight;
}

export default function BasisDetails({ basis }: { basis: SajuResult["basis"] }) {
  return (
    <details className="no-screenshot mt-4 bg-white border border-line rounded-[22px] px-5 py-4">
      <summary className="font-bold text-sm cursor-pointer">어떻게 계산했고, 왜 믿을 수 있나요</summary>
      <ul className="mt-3 space-y-1.5 text-sm text-muted leading-relaxed list-disc pl-4">
        <li>{BASIS_COPY.jeolgi}</li>
        <li>{BASIS_COPY.dayBoundary}</li>
        {basis.dstApplied && <li>{BASIS_COPY.dst}</li>}
        <li>{BASIS_COPY.trueSolar}</li>
        {basis.boundaryWarning && <li>{boundaryText(basis.boundaryWarning)}</li>}
      </ul>
      <p className="mt-4 font-bold text-sm">{TRUST_COPY.title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted leading-relaxed list-disc pl-4">
        {TRUST_COPY.lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </details>
  );
}

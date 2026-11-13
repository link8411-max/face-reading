import type { Ref } from "react";
import ResultCard from "@/components/result/ResultCard";
import {
  BALANCED_CHIP, DISCLAIMER, FOREHEAD_NOTE, GUANSANG_TYPES, LABEL_COPY, PALACE_COPY, SCHOOL_NOTE, SHAPE_COPY, ZONE_COPY, evidenceText,
} from "@/content/guansang";
import type { GuansangResult } from "@/lib/face/guansang";

// 관상 2판 결과 화면 본문. 공유·저장·다시하기 버튼(ResultActions)과 다음 테스트는 페이지가 이 앞뒤에 붙인다.
// 순서: 카드(캡처) → 전통 용어 → 왜 이 상인가요 → [children: 버튼] → 조심할 점 → 잘 맞는 상 → 안내 → after(쿠팡 배너·다음 테스트는 페이지가 붙인다)
export default function GuansangResultView({ result, captureRef, actions, after }: {
  result: GuansangResult;
  captureRef?: Ref<HTMLElement>;
  actions?: React.ReactNode;
  after?: React.ReactNode;
}) {
  const t = GUANSANG_TYPES[result.type];
  const partner = GUANSANG_TYPES[t.partner];
  const chips = [SHAPE_COPY[result.shape].easy, ZONE_COPY[result.zone].easy, ...(result.balanced ? [BALANCED_CHIP] : [])];
  const reasons = result.palaces.map((p) => {
    const c = PALACE_COPY[p.key];
    return { label: `${LABEL_COPY[p.label]} · ${c.easy}(${c.part})`, text: c.lines[p.label] + (p.label === "grow" ? " " + c.grow : "") };
  });

  return (
    <div className="pb-6 animate-fade-in">
      <ResultCard captureRef={captureRef} cast="haetae" eyebrow="AI 관상" title={t.nickname} summary={t.oneLiner} chips={chips} reasons={reasons} />
      <p className="mt-3 text-center text-[11px] text-muted leading-relaxed">
        {SHAPE_COPY[result.shape].traditional} · {ZONE_COPY[result.zone].traditional} · {SCHOOL_NOTE}
      </p>

      <section className="mt-4 bg-white border border-line rounded-[22px] px-5 py-4 no-screenshot">
        <h3 className="font-serif font-bold text-base">왜 이 상인가요</h3>
        <p className="mt-2 text-sm leading-relaxed">{evidenceText(result.shape, result.zone)}</p>
        {result.foreheadUncertain && <p className="mt-2 text-xs text-muted leading-relaxed">{FOREHEAD_NOTE}</p>}
      </section>

      {actions}

      <section className="no-screenshot mt-4 bg-card-2 rounded-[22px] px-5 py-4">
        <h3 className="font-serif font-bold text-base">조심할 점</h3>
        <p className="mt-2 text-sm leading-relaxed">{t.caution.situation}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-accent">{t.caution.action}</p>
      </section>

      <section className="no-screenshot mt-3 bg-card-2 rounded-[22px] px-5 py-4">
        <h3 className="font-serif font-bold text-base">잘 맞는 상</h3>
        <p className="mt-2 text-sm font-bold">{partner.nickname}</p>
        <p className="mt-1 text-sm leading-relaxed">{t.partnerLine}</p>
      </section>

      <p className="no-screenshot mt-4 text-xs text-muted leading-relaxed text-center">{DISCLAIMER}</p>
      {after}
    </div>
  );
}

import type { Ref } from "react";
import { DAY_MASTER_COPY, DISCLAIMER, SOURCE_LINE, BASIS_COPY, cautionFor } from "@/content/saju";
import { ELEMENTS } from "@/lib/saju/keys";
import type { SajuResult } from "@/lib/saju/engine";
import SajuTable from "./SajuTable";
import ElementBars from "./ElementBars";
import TenGodSummary from "./TenGodSummary";
import DaeunTimeline from "./DaeunTimeline";
import SeunCard from "./SeunCard";
import BasisDetails, { boundaryText } from "./BasisDetails";

// 내 사주 풀이 결과 본문. 버튼(actions)과 쿠팡 배너 등(after)은 페이지가 붙인다.
// birthLine은 화면에만 보이는 생년월일 줄(no-screenshot)
export default function SajuResultView({ result, captureRef, actions, after, birthLine }: {
  result: SajuResult;
  captureRef?: Ref<HTMLElement>;
  actions?: React.ReactNode;
  after?: React.ReactNode;
  birthLine?: string;
}) {
  const dm = DAY_MASTER_COPY[result.dayMaster.stem];
  const total = ELEMENTS.reduce((a, e) => a + result.elements[e], 0);
  const caution = cautionFor(result.elements, total);
  const warn = result.basis.boundaryWarning;

  return (
    <div className="pb-6 animate-fade-in">
      {(!result.basis.hourKnown || warn) && (
        <div className="no-screenshot mb-3 bg-card-2 rounded-[18px] px-4 py-3 text-[13px] leading-relaxed text-muted space-y-1">
          {!result.basis.hourKnown && <p>{BASIS_COPY.hourUnknown}</p>}
          {warn && <p>{boundaryText(warn)}</p>}
        </div>
      )}

      <section ref={captureRef} className="bg-card rounded-[30px] p-4 space-y-3">
        {birthLine && <p className="no-screenshot text-center text-sm text-muted">{birthLine}</p>}
        <div className="bg-white rounded-[22px] border border-line p-4">
          <SajuTable pillars={result.pillars} />
        </div>

        <div className="bg-white rounded-[22px] border border-line px-5 py-4">
          <h2 className="font-serif font-bold text-[24px] leading-snug break-keep">{dm.title}</h2>
          <p className="mt-2 text-sm leading-relaxed">{dm.text}</p>
          <p className="mt-1.5 text-[11px] text-muted">{dm.basis}</p>
        </div>

        <div className="bg-white rounded-[22px] border border-line px-5 py-4">
          <h3 className="font-serif font-bold text-base mb-3">다섯 기운</h3>
          <ElementBars elements={result.elements} />
        </div>

        <div className="bg-white rounded-[22px] border border-line px-5 py-4">
          <h3 className="font-serif font-bold text-base mb-3">내 사주에서 제일 센 것 두 가지</h3>
          <TenGodSummary tenGods={result.tenGods} />
        </div>

        {result.daeun.length > 0 && (
          <div className="bg-white rounded-[22px] border border-line px-4 py-4">
            <h3 className="font-serif font-bold text-base mb-3 px-1">지금 10년의 흐름</h3>
            <DaeunTimeline daeun={result.daeun} dayStem={result.dayMaster.stem} />
          </div>
        )}

        <div className="bg-white rounded-[22px] border border-line px-5 py-4">
          <SeunCard seun={result.seun} dayBranch={result.pillars.day.branch} />
        </div>

        <div className="no-screenshot bg-card-2 rounded-[22px] px-5 py-4">
          <h3 className="font-serif font-bold text-base">조심할 점 하나</h3>
          <p className="mt-2 text-sm leading-relaxed">{caution.situation}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-accent">{caution.action}</p>
          <p className="mt-2 text-[11px] text-muted">{caution.basis}</p>
        </div>

        <div className="flex justify-between items-center px-1 text-[11px] text-muted">
          <span className="font-serif font-bold text-xs text-ink">운명을 읽다</span>
          <span>unse-ai.com</span>
        </div>
      </section>

      {actions}

      <BasisDetails basis={result.basis} />

      <p className="no-screenshot mt-4 text-xs text-muted leading-relaxed text-center">{SOURCE_LINE}</p>
      <p className="no-screenshot mt-2 text-xs text-muted leading-relaxed text-center">{DISCLAIMER}</p>
      {after}
    </div>
  );
}

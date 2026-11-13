"use client";

import type { Ref } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";
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
  const tr = useT();
  // 영어 페이지는 서버가 내려 준 영어 문구를, 그 밖(한국어)은 지금 문구를 쓴다
  const en = useEnCopy()?.guansang;
  const TYPES = en?.types ?? GUANSANG_TYPES;
  const SHAPES = en?.shape ?? SHAPE_COPY;
  const ZONES = en?.zone ?? ZONE_COPY;
  const PALACES = en?.palace ?? PALACE_COPY;
  const LABELS = en?.label ?? LABEL_COPY;
  const t = TYPES[result.type];
  const partner = TYPES[t.partner];
  const chips = [SHAPES[result.shape].easy, ZONES[result.zone].easy, ...(result.balanced ? [en?.balancedChip ?? BALANCED_CHIP] : [])];
  const reasons = result.palaces.map((p) => {
    const c = PALACES[p.key];
    return { label: `${LABELS[p.label]} · ${c.easy}(${c.part})`, text: c.lines[p.label] + (p.label === "grow" ? " " + c.grow : "") };
  });

  return (
    <div className="pb-6 animate-fade-in">
      <ResultCard captureRef={captureRef} cast="haetae" eyebrow={tr("face.eyebrow")} title={t.nickname} summary={t.oneLiner} chips={chips} reasons={reasons} />
      <p className="mt-3 text-center text-[11px] text-muted leading-relaxed">
        {SHAPES[result.shape].traditional} · {ZONES[result.zone].traditional} · {en?.schoolNote ?? SCHOOL_NOTE}
      </p>

      <section className="mt-4 bg-white border border-line rounded-[22px] px-5 py-4 no-screenshot">
        <h3 className="font-serif font-bold text-base">{tr("face.why")}</h3>
        <p className="mt-2 text-sm leading-relaxed">{en ? `${SHAPES[result.shape].evidence} ${ZONES[result.zone].evidence}` : evidenceText(result.shape, result.zone)}</p>
        {result.foreheadUncertain && <p className="mt-2 text-xs text-muted leading-relaxed">{en?.foreheadNote ?? FOREHEAD_NOTE}</p>}
      </section>

      {actions}

      <section className="no-screenshot mt-4 bg-card-2 rounded-[22px] px-5 py-4">
        <h3 className="font-serif font-bold text-base">{tr("face.caution")}</h3>
        <p className="mt-2 text-sm leading-relaxed">{t.caution.situation}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-accent">{t.caution.action}</p>
      </section>

      <section className="no-screenshot mt-3 bg-card-2 rounded-[22px] px-5 py-4">
        <h3 className="font-serif font-bold text-base">{tr("face.partner")}</h3>
        <p className="mt-2 text-sm font-bold">{partner.nickname}</p>
        <p className="mt-1 text-sm leading-relaxed">{t.partnerLine}</p>
      </section>

      <p className="no-screenshot mt-4 text-xs text-muted leading-relaxed text-center">{en?.disclaimer ?? DISCLAIMER}</p>
      {after}
    </div>
  );
}

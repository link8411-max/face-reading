"use client";

import { useEffect, useState } from "react";
import { SmileFace } from "@/components/icons";
import { CAST, type CastKey } from "@/content/cast";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";

/** 분석 중에 단계 문구를 바꿔 가며 보여 줄 때 쓰는 번호. 실제 진행과 무관하므로 막대·퍼센트는 그리지 않는다. */
export function useAnalyzeStep(active: boolean, count: number, ms = 1800) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t = setInterval(() => setStep((s) => Math.min(s + 1, count - 1)), ms);
    return () => clearInterval(t);
  }, [active, count, ms]);
  return step;
}

export const ANALYZE_STEPS = ["얼굴형 살피는 중", "이목구비 비율 재는 중", "결과 정리하는 중"];
/** 언어에 맞는 단계 문구 */
export function analyzeSteps(t: (k: "analyzing.step1" | "analyzing.step2" | "analyzing.step3") => string): string[] {
  return [t("analyzing.step1"), t("analyzing.step2"), t("analyzing.step3")];
}

// 분석 중 화면: 가운데 사진(없으면 얼굴 선 그림) 위로 살펴보는 줄이 오르내리고, 오른쪽 아래에서 캐릭터가 고개를 갸웃한다.
// 단계 문구만 바뀐다(가짜 진행률 없음). 움직임 줄이기 설정이면 줄·고개 움직임이 멈춘다(globals.css).
export default function AnalyzingOverlay({ cast, photo, steps, step }: { cast: CastKey; photo?: string; steps: string[]; step: number }) {
  const c = CAST[cast];
  const locale = useLocale();
  const t = useT();
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-paper/95 backdrop-blur-sm no-screenshot" role="status" aria-live="polite">
      <div className="w-full max-w-xs px-6 flex flex-col items-center text-center">
        <div className="relative w-[164px] h-[164px] rounded-[36px] bg-card border-[1.5px] border-dashed border-muted">
          <div className="absolute inset-[26px] overflow-hidden rounded-[22px] grid place-items-center">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="w-full h-full object-cover opacity-80" />
            ) : (
              <SmileFace size={112} />
            )}
          </div>
          <span aria-hidden className="scan-beam absolute left-2.5 right-2.5 top-2.5 h-1 rounded bg-accent shadow-[0_0_14px_var(--color-accent)]" />
          <img
            src={c.face}
            alt={`${locale === "en" ? c.en : c.name} ${t("cast.alt")}`}
            width={96}
            height={96}
            className="peek-cast absolute -right-11 -bottom-7 w-24 h-24 rounded-full object-cover border-4 border-paper"
            style={{ background: c.bg }}
          />
        </div>
        <p className="mt-9 font-serif font-extrabold text-[17px] min-h-[3em] break-keep">{steps[Math.min(step, steps.length - 1)]}</p>
      </div>
    </div>
  );
}

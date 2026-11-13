"use client";

import type { ReactNode, Ref } from "react";
import { SmileFace } from "@/components/icons";
import { CAST, type CastKey } from "@/content/cast";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";

export interface ResultCardProps {
  eyebrow: string;
  title: string;
  summary?: string;
  art?: ReactNode;
  bars?: { label: string; value: number }[]; // 0~100
  chips?: string[];
  reasons: { label: string; text: string }[];
  captureRef?: Ref<HTMLElement>;
  cast?: CastKey; // 있으면 art 기본값이 그 캐릭터 그림
}

// 결과 카드 (디자인 시안 ResultCard): 캡처 한 장으로 완결되도록 결과 이름·그림·운 막대·근거·워터마크를 담는다.
export default function ResultCard({ eyebrow, title, summary, art, bars, chips, reasons, captureRef, cast }: ResultCardProps) {
  const ci = cast ? CAST[cast] : null;
  const locale = useLocale();
  const t = useT();
  return (
    <article ref={captureRef} className="reveal-card relative overflow-hidden bg-card border border-line rounded-[30px] px-[22px] pt-6 pb-5 flex flex-col text-ink">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true" className="absolute -right-2.5 -top-1.5">
        <circle cx="74" cy="46" r="32" fill="#F7F8FC" />
        <circle cx="90" cy="36" r="29" fill="#EEF1FA" />
        <path d="M26 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#2D55FF" />
      </svg>
      <p className="relative text-xs font-medium text-accent-ink">{eyebrow}</p>
      <h2 className="relative font-serif font-bold text-[25px] leading-[1.4] mt-2 pr-16 break-keep">{title}</h2>
      {summary && <p className="relative text-[13px] leading-relaxed text-muted mt-2">{summary}</p>}

      <div className="flex gap-4 mt-[18px] items-center">
        <div className="reveal-pop flex-none" style={{ "--d": "0.35s" } as React.CSSProperties}>
          {art ?? (ci ? (
            <img src={ci.img} alt={`${locale === "en" ? ci.en : ci.name} ${t("cast.alt")}`} width={104} height={104} className="w-[104px] h-[104px] rounded-[26px] object-cover" style={{ background: ci.bg }} />
          ) : (
            <SmileFace size={104} />
          ))}
        </div>
        {bars ? (
          <div className="flex-1 flex flex-col gap-2.5">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs">
                  <span>{b.label}</span>
                  <span className="font-bold">{b.value}</span>
                </div>
                <div role="meter" aria-label={b.label} aria-valuenow={b.value} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded-full bg-card-2 mt-[5px]">
                  <div className="h-1.5 rounded-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, b.value))}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-wrap gap-1.5">
            {(chips ?? []).map((c, i) => (
              <span key={c} className="reveal-pop text-xs bg-card-2 rounded-full px-3 py-1.5" style={{ "--d": `${0.7 + i * 0.12}s` } as React.CSSProperties}>{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card-2 rounded-[18px] mt-4 px-4 py-3.5 flex flex-col gap-2">
        {reasons.map((r) => (
          <p key={r.label} className="text-[13px] leading-relaxed">
            <span className="font-bold text-accent-ink">{r.label}</span> {r.text}
          </p>
        ))}
      </div>

      <div className="flex justify-between items-center mt-3.5 text-[11px] text-muted">
        <span className="font-serif font-bold text-xs text-ink">{t("brand.name")}</span>
        <span>unse-ai.com</span>
      </div>
    </article>
  );
}

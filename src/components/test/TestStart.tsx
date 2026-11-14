"use client";

import type { ChangeEvent, RefObject } from "react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import MoreTests from "@/components/MoreTests";
import StartTabs, { GUIDE_TAB, type StartTab } from "@/components/test/StartTabs";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import GenderPills, { type Gender } from "@/components/test/GenderPills";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { t as tr } from "@/lib/i18n/dict";
import type { Locale } from "@/lib/i18n/locales";

export function analyzeButtonLabel(s: { hasImage: boolean; gender: Gender | null; needsGender?: boolean; loading: boolean; preparing: boolean; label: string }, locale: Locale = "ko") {
  if (!s.hasImage) return tr(locale, "start.needPhoto");
  if (s.needsGender !== false && !s.gender) return tr(locale, "start.needGender");
  if (s.preparing) return tr(locale, "start.preparing");
  if (s.loading) return tr(locale, "start.analyzing");
  return s.label;
}

// 실패 안내. 분석할 때마다 error가 null → 문구로 바뀌어 다시 붙으므로, 같은 이유로 또 실패해도 흔들리며 눈에 들어오게 한다
function ErrorNote({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [text]);
  return (
    <p ref={ref} role="alert" className="mt-4 rounded-[18px] bg-card border border-accent/40 text-accent-ink text-sm p-3 text-center animate-shake-x">
      {text}
    </p>
  );
}

// 사진 테스트 공통 시작 화면: 제목·설명 → 탭[테스트 | 나올 수 있는 결과 | 설명]. 테스트 탭은 성별 → 사진 → 분석 버튼 → 안심 문구·안내 칩.
// 390px 휴대폰 첫 화면 안에 분석 버튼이 들어오게 사진 칸을 낮게 두었다(11/14 사용자: "스크롤 압박이 너무 심하다", e2e/start-fold.spec.ts).
// 성별을 분석에 쓰지 않는 테스트(관상)는 needsGender={false}로 성별을 묻지 않는다
export default function TestStart({
  heading, desc, tips, analyzeLabel, image, gender, onGender, onFile, onAnalyze, onReset, loading, error, preparing = false, imageRef, needsGender = true, preview, testTab,
}: {
  heading: string;
  testTab: string; // 첫 탭 이름(예: "동물상 보기")
  desc: string;
  tips: string[];
  analyzeLabel: string;
  image: string | null;
  gender?: Gender | null;
  onGender?: (g: Gender) => void;
  needsGender?: boolean;
  preview?: ReactNode; // "나올 수 있는 결과" 미리 보기(ResultPreview). 있으면 둘째 탭이 된다
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onReset: () => void;
  loading: boolean;
  error: string | null;
  preparing?: boolean;
  imageRef?: RefObject<HTMLImageElement | null>; // 분석이 이 이미지 요소를 직접 읽는다 (관상: face-api, 동물상: MediaPipe)
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const path = usePathname() ?? "/";
  const t = useT();
  const locale = useLocale();
  const label = analyzeButtonLabel({ hasImage: !!image, gender: gender ?? null, needsGender, loading, preparing, label: analyzeLabel }, locale);
  const ready = label === analyzeLabel;

  const testPanel = (
    <div className="flex flex-col">
      {needsGender && (
        <fieldset className="mt-4">
          <legend className="sr-only">{t("gender.label")}</legend>
          <GenderPills value={gender ?? null} onChange={(g) => onGender?.(g)} />
        </fieldset>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-3 min-h-[140px] rounded-[28px] border-[1.5px] border-dashed border-[#B9C3E0] bg-card-2 flex flex-col items-center justify-center gap-2.5 p-4 overflow-hidden"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imageRef} src={image} alt={t("start.chosenAlt")} crossOrigin="anonymous" className="max-h-64 rounded-[22px] object-contain" />
        ) : (
          <>
            <Icon name="camera" size={36} className="text-accent-ink" />
            <span className="text-[15px] font-bold">{t("btn.choosePhoto")}</span>
            <span className="text-xs text-muted">{t("start.photoHint")}</span>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {error && <ErrorNote text={error} />}

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!ready}
        className="press mt-3.5 h-[52px] rounded-full bg-accent text-white text-[15px] font-medium disabled:opacity-45"
      >
        {label}
      </button>

      <div className="mt-3 flex items-center gap-2 px-1">
        <Icon name="shield" size={16} className="text-accent-ink flex-none" />
        <span className="text-xs leading-normal text-muted">{t("privacy.line")}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {tips.map((tip) => (
          <span key={tip} className="text-xs text-muted bg-card border border-line rounded-full px-3 py-[7px]">{tip}</span>
        ))}
        {image && (
          <button type="button" onClick={() => { if (fileRef.current) fileRef.current.value = ""; onReset(); }} className="text-xs text-ink bg-card border border-line rounded-full px-3 py-[7px]">
            {t("start.anotherPhoto")}
          </button>
        )}
      </div>
    </div>
  );
  const tabs: StartTab[] = [
    { key: "test", label: testTab, content: testPanel },
    ...(preview ? [{ key: "preview", label: t("start.tabPreview"), content: preview }] : []),
    { key: GUIDE_TAB, label: t("start.tabGuide"), content: <p className="mt-5 text-sm text-muted leading-relaxed">{desc}</p> },
  ];

  return (
    <div className="flex flex-col pb-7 no-screenshot">
      <h2 className="mt-1 font-serif font-bold text-[24px] leading-[1.35] whitespace-pre-line break-keep">{heading}</h2>
      <StartTabs tabs={tabs} className="mt-3.5" />
      <MoreTests current={path} className="mt-8" locale={locale} />
    </div>
  );
}

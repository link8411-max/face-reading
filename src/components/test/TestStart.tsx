"use client";

import type { ChangeEvent, RefObject } from "react";
import { useEffect, useRef } from "react";
import { Icon, SmileFace } from "@/components/icons";
import GenderPills, { type Gender } from "@/components/test/GenderPills";

export function analyzeButtonLabel(s: { hasImage: boolean; gender: Gender | null; needsGender?: boolean; loading: boolean; preparing: boolean; label: string }) {
  if (!s.hasImage) return "사진을 먼저 골라 주세요";
  if (s.needsGender !== false && !s.gender) return "성별을 먼저 골라 주세요";
  if (s.preparing) return "분석 준비 중…";
  if (s.loading) return "분석 중…";
  return s.label;
}

// 실패 안내. 분석할 때마다 error가 null → 문구로 바뀌어 다시 붙으므로, 같은 이유로 또 실패해도 흔들리며 눈에 들어오게 한다
function ErrorNote({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [text]);
  return (
    <p ref={ref} role="alert" className="mt-4 rounded-[18px] bg-white border border-accent/40 text-accent text-sm p-3 text-center animate-shake-x">
      {text}
    </p>
  );
}

// 사진 테스트 공통 시작 화면 (디자인 시안 TestStart): 성별 → 사진 → 안내 → 분석 버튼
// 성별을 분석에 쓰지 않는 테스트(관상)는 needsGender={false}로 성별을 묻지 않는다
export default function TestStart({
  heading, desc, tips, analyzeLabel, image, gender, onGender, onFile, onAnalyze, onReset, loading, error, preparing = false, imageRef, needsGender = true,
}: {
  heading: string;
  desc: string;
  tips: string[];
  analyzeLabel: string;
  image: string | null;
  gender?: Gender | null;
  onGender?: (g: Gender) => void;
  needsGender?: boolean;
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onReset: () => void;
  loading: boolean;
  error: string | null;
  preparing?: boolean;
  imageRef?: RefObject<HTMLImageElement | null>; // 분석이 이 이미지 요소를 직접 읽는다 (관상: face-api, 동물상: MediaPipe)
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = analyzeButtonLabel({ hasImage: !!image, gender: gender ?? null, needsGender, loading, preparing, label: analyzeLabel });
  const ready = label === analyzeLabel;

  return (
    <div className="flex flex-col pb-7 no-screenshot">
      <h2 className="mt-2.5 font-serif font-bold text-[27px] leading-[1.4] whitespace-pre-line break-keep">{heading}</h2>
      <p className="mt-2.5 text-sm text-muted leading-relaxed">{desc}</p>

      {needsGender && (
        <fieldset className="mt-6">
          <legend className="text-[13px] text-muted mb-2.5">나는</legend>
          <GenderPills value={gender ?? null} onChange={(g) => onGender?.(g)} />
        </fieldset>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-[18px] min-h-[290px] rounded-[28px] border-[1.5px] border-dashed border-[#D6C8B4] bg-card-2 flex flex-col items-center justify-center gap-3.5 p-4 overflow-hidden"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imageRef} src={image} alt="고른 사진" crossOrigin="anonymous" className="max-h-64 rounded-[22px] object-contain" />
        ) : (
          <>
            <SmileFace />
            <span className="text-[15px] font-bold">사진 고르기</span>
            <span className="text-xs text-muted">셀카도 좋아요 · 정면이면 더 정확해요</span>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      <div className="flex flex-wrap gap-2 mt-3.5">
        {tips.map((t) => (
          <span key={t} className="text-xs text-muted bg-white border border-line rounded-full px-3 py-[7px]">{t}</span>
        ))}
        {image && (
          <button type="button" onClick={() => { if (fileRef.current) fileRef.current.value = ""; onReset(); }} className="text-xs text-ink bg-white border border-line rounded-full px-3 py-[7px]">
            다른 사진 고르기
          </button>
        )}
      </div>

      {error && <ErrorNote text={error} />}

      <div className="mt-7 flex items-center gap-2.5 bg-white rounded-[18px] px-3.5 py-3">
        <Icon name="shield" size={20} className="text-accent flex-none" />
        <span className="text-xs leading-normal text-muted">사진은 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않아요.</span>
      </div>
      <button
        type="button"
        onClick={onAnalyze}
        disabled={!ready}
        className="mt-3 h-[52px] rounded-full bg-ink text-paper text-[15px] font-medium disabled:opacity-45"
      >
        {label}
      </button>
    </div>
  );
}

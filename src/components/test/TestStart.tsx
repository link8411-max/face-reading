"use client";

import type { ChangeEvent, RefObject } from "react";
import { useRef } from "react";
import { Icon, SmileFace } from "@/components/icons";
import GenderPills, { type Gender } from "@/components/test/GenderPills";

export function analyzeButtonLabel(s: { hasImage: boolean; gender: Gender | null; loading: boolean; preparing: boolean; label: string }) {
  if (!s.hasImage) return "사진을 먼저 골라 주세요";
  if (!s.gender) return "성별을 먼저 골라 주세요";
  if (s.preparing) return "분석 준비 중…";
  if (s.loading) return "분석 중…";
  return s.label;
}

// 사진 테스트 공통 시작 화면 (디자인 시안 TestStart): 성별 → 사진 → 안내 → 분석 버튼
export default function TestStart({
  heading, desc, tips, analyzeLabel, image, gender, onGender, onFile, onAnalyze, onReset, loading, error, preparing = false, imageRef,
}: {
  heading: string;
  desc: string;
  tips: string[];
  analyzeLabel: string;
  image: string | null;
  gender: Gender | null;
  onGender: (g: Gender) => void;
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onReset: () => void;
  loading: boolean;
  error: string | null;
  preparing?: boolean;
  imageRef?: RefObject<HTMLImageElement | null>; // face-api가 이 이미지 요소를 직접 읽는다 (관상·동물상)
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = analyzeButtonLabel({ hasImage: !!image, gender, loading, preparing, label: analyzeLabel });
  const ready = label === analyzeLabel;

  return (
    <div className="flex flex-col pb-7 no-screenshot">
      <h2 className="mt-2.5 font-serif font-bold text-[27px] leading-[1.4] whitespace-pre-line break-keep">{heading}</h2>
      <p className="mt-2.5 text-sm text-muted leading-relaxed">{desc}</p>

      <fieldset className="mt-6">
        <legend className="text-[13px] text-muted mb-2.5">나는</legend>
        <GenderPills value={gender} onChange={onGender} />
      </fieldset>

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

      {error && <p role="alert" className="mt-4 rounded-[18px] bg-white border border-accent/40 text-accent text-sm p-3 text-center">{error}</p>}

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

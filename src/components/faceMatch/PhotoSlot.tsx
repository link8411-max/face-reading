"use client";

import { useRef, type ChangeEvent } from "react";
import { SmileFace } from "@/components/icons";
import GenderPills, { type Gender } from "@/components/test/GenderPills";
import { animalTypeDB } from "@/lib/animalTypeDB";
import type { AnimalKey } from "@/lib/animal/matcher";

// 얼굴 궁합·우리 팀 삼국지의 사진 한 칸: 성별 + 사진 + 그 칸의 오류. 이미 결과가 있는 칸(fixed)은 결과만 보여준다.
export default function PhotoSlot({ label, gender, onGender, image, onFile, error, fixed, children }: {
  label: string;
  gender: Gender | null;
  onGender: (g: Gender) => void;
  image: string | null;
  onFile: (dataUrl: string) => void;
  error: string | null;
  fixed?: AnimalKey;
  children?: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => onFile(r.result as string);
    r.readAsDataURL(f);
    e.target.value = "";
  };
  return (
    <section aria-label={label} className="bg-card-2 rounded-[22px] p-4 flex flex-col gap-3">
      <p className="font-serif font-bold text-base">{label}</p>
      {children}
      {fixed ? (
        <p className="bg-paper rounded-[18px] px-4 py-3 text-sm">
          <span className="font-bold">{animalTypeDB[fixed].name}</span> <span className="text-muted">결과로 볼게요</span>
        </p>
      ) : (
        <>
          <GenderPills value={gender} onChange={onGender} />
          <button type="button" onClick={() => fileRef.current?.click()} className="min-h-[150px] rounded-[18px] border-[1.5px] border-dashed border-[#D6C8B4] bg-paper flex flex-col items-center justify-center gap-2 p-3 overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={`${label} 사진`} className="max-h-40 rounded-[14px] object-contain" />
            ) : (
              <>
                <SmileFace size={64} />
                <span className="text-sm font-bold">사진 고르기</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" aria-label={`${label} 사진 파일`} />
        </>
      )}
      {error && <p role="alert" className="text-sm text-accent">{error}</p>}
    </section>
  );
}

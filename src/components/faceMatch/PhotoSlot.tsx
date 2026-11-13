"use client";

import { useRef, type ChangeEvent } from "react";
import { SmileFace } from "@/components/icons";
import GenderPills, { type Gender } from "@/components/test/GenderPills";
import { animalTypeDB } from "@/lib/animalTypeDB";
import type { AnimalKey } from "@/lib/animal/matcher";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";

// 얼굴 궁합·우리 팀 삼국지의 사진 한 칸: 성별 + 사진 + 그 칸의 오류. 이미 결과가 있는 칸(fixed)은 결과만 보여준다.
export default function PhotoSlot({ label, gender, onGender, image, onFile, error, fixed, disabled, children }: {
  label: string;
  gender: Gender | null;
  onGender: (g: Gender) => void;
  image: string | null;
  onFile: (dataUrl: string) => void;
  error: string | null;
  fixed?: AnimalKey;
  disabled?: boolean; // 분석 중에는 바꿀 수 없다 (분석이 끝나며 바꾼 사진을 덮어쓰지 않게)
  children?: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const locale = useLocale();
  const en = locale === "en";
  const enCopy = useEnCopy();
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
          <span className="font-bold">{en ? enCopy?.animals?.[fixed]?.name : animalTypeDB[fixed].name}</span> <span className="text-muted">{t("fm.fixedTail")}</span>
        </p>
      ) : (
        <>
          <GenderPills value={gender} onChange={onGender} label={`${label} ${t("fm.genderAria")}`} disabled={disabled} />
          <button type="button" aria-label={`${label} ${t("fm.pickAria")}`} disabled={disabled} onClick={() => fileRef.current?.click()} className="min-h-[150px] rounded-[18px] border-[1.5px] border-dashed border-[#B9C3E0] bg-paper flex flex-col items-center justify-center gap-2 p-3 overflow-hidden disabled:opacity-60">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={`${label} ${t("fm.photoAlt")}`} className="max-h-40 rounded-[14px] object-contain" />
            ) : (
              <>
                <SmileFace size={64} />
                <span className="text-sm font-bold">{t("btn.choosePhoto")}</span>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} disabled={disabled} className="hidden" aria-label={`${label} ${t("fm.fileAria")}`} />
        </>
      )}
      {error && <p role="alert" id={`${label}-error`} className="text-sm text-accent animate-shake-x">{error}</p>}
    </section>
  );
}

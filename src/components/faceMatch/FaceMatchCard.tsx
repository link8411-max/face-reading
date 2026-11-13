"use client";

import type { Ref } from "react";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";
import { REL_NAME as EN_REL_NAME } from "@/content/en/faceMatch";
import { animalTypeDB } from "@/lib/animalTypeDB";
import { REL_NAME, type FaceMatchResult, type Rel } from "@/lib/faceMatch/compat";
import type { AnimalKey } from "@/lib/animal/matcher";

// 얼굴 궁합 결과 카드 (캡처 한 장 완결, 워터마크)
export default function FaceMatchCard({ a, b, rel, result, captureRef }: { a: AnimalKey; b: AnimalKey; rel: Rel; result: FaceMatchResult; captureRef?: Ref<HTMLElement> }) {
  const t = useT();
  const en = useLocale() === "en";
  const names = useEnCopy()?.animals;
  const relName = en ? EN_REL_NAME : REL_NAME;
  const animal = (k: AnimalKey) => (en && names ? names[k].name : animalTypeDB[k].name);
  return (
    <article ref={captureRef} className="relative overflow-hidden bg-card border border-line rounded-[30px] px-[22px] pt-6 pb-5 flex flex-col text-ink">
      <p className="text-xs font-medium text-accent">{relName[rel]} {t("fm.cardSuffix")}</p>
      <p className="font-serif font-bold text-[22px] mt-2 break-keep">
        {animal(a)} <span className="text-muted font-normal">×</span> {animal(b)}
      </p>
      <h2 className="font-serif font-bold text-[30px] leading-[1.3] mt-3 text-accent break-keep">{result.headline}</h2>
      <p className="self-start mt-2 text-sm font-medium px-3 py-1 rounded-full bg-card-2">{result.label}</p>
      <div className="bg-card-2 rounded-[18px] mt-4 px-4 py-3.5 flex flex-col gap-2 text-[13px] leading-relaxed">
        {result.lines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <p className="mt-3 text-[13px] text-muted">
        {result.others.map((o) => `${relName[o.rel]} ${o.score}${t("fm.pointsSuffix")}`).join(" · ")}
      </p>
      <div className="flex justify-between items-center mt-3.5 text-[11px] text-muted">
        <span className="font-serif font-bold text-xs text-ink">{t("brand.name")}</span>
        <span>unse-ai.com</span>
      </div>
    </article>
  );
}

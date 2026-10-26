import type { Ref } from "react";
import { animalTypeDB } from "@/lib/animalTypeDB";
import { REL_NAME, type FaceMatchResult, type Rel } from "@/lib/faceMatch/compat";
import type { AnimalKey } from "@/lib/animal/matcher";

// 얼굴 궁합 결과 카드 (캡처 한 장 완결, 워터마크)
export default function FaceMatchCard({ a, b, rel, result, captureRef }: { a: AnimalKey; b: AnimalKey; rel: Rel; result: FaceMatchResult; captureRef?: Ref<HTMLElement> }) {
  return (
    <article ref={captureRef} className="relative overflow-hidden bg-card rounded-[30px] px-[22px] pt-6 pb-5 flex flex-col text-ink">
      <p className="text-xs font-medium text-accent">{REL_NAME[rel]} 궁합</p>
      <p className="font-serif font-bold text-[22px] mt-2 break-keep">
        {animalTypeDB[a].name} <span className="text-muted font-normal">×</span> {animalTypeDB[b].name}
      </p>
      <h2 className="font-serif font-bold text-[30px] leading-[1.3] mt-3 text-accent break-keep">{result.headline}</h2>
      <p className="self-start mt-2 text-sm font-medium px-3 py-1 rounded-full bg-paper">{result.label}</p>
      <div className="bg-paper rounded-[18px] mt-4 px-4 py-3.5 flex flex-col gap-2 text-[13px] leading-relaxed">
        {result.lines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <p className="mt-3 text-[13px] text-muted">
        {result.others.map((o) => `${REL_NAME[o.rel]} ${o.score}점`).join(" · ")}
      </p>
      <div className="flex justify-between items-center mt-3.5 text-[11px] text-muted">
        <span className="font-serif font-bold text-xs text-ink">운명을 읽다</span>
        <span>unse-ai.com</span>
      </div>
    </article>
  );
}

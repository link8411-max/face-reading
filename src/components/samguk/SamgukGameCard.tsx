import type { Ref } from "react";
import type { SamgukCharacter } from "@/lib/samgukDB";

const FACTION_LABEL: Record<SamgukCharacter["faction"], string> = { 위: "WEI · 魏", 촉: "SHU · 蜀", 오: "WU · 吳", 기타: "HERO · 群" };
const FUN_ORDER = ["칼퇴력", "술자리생존", "워라밸", "재테크", "꼰대력"] as const;

// 삼국지 결과 카드 (디자인 시안 SamgukCard): 남색 레트로 게임 카드 + 도트 초상화 + 회사생활 STATUS
export default function SamgukGameCard({ character: c, similarity, captureRef }: { character: SamgukCharacter; similarity: number; captureRef?: Ref<HTMLElement> }) {
  return (
    <article ref={captureRef} className="bg-navy-game text-[#F4EAD5] border-4 border-[#F4EAD5] outline outline-4 outline-navy-game m-1 px-4 pt-[18px] pb-4 flex flex-col">
      <div className="flex justify-between font-pixel text-xs text-gold-game">
        <span>PLAYER 1</span>
        <span>{FACTION_LABEL[c.faction]}</span>
      </div>

      <div className="flex gap-3.5 mt-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/images/samguk/${c.name}.jpg`} alt={`${c.name} 도트 초상화`} className="w-28 h-[136px] object-cover border-[3px] border-gold-game [image-rendering:pixelated] flex-none" />
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-xs text-[#C9BFA9]">{c.role}</p>
          <h2 className="font-serif font-bold text-[30px] mt-1">{c.name}</h2>
          <p className="font-serif text-sm text-[#C9BFA9] mt-0.5">{c.hanja} · 닮음 {similarity}%</p>
          <p className="mt-2.5 self-start bg-gold-game text-navy-game text-xs font-bold px-2 py-1">현대 직업 · {c.modernJob}</p>
        </div>
      </div>

      <p className="mt-3.5 font-pixel text-xs text-gold-game">▶ 회사생활 STATUS</p>
      <div className="flex flex-col gap-2 mt-2">
        {FUN_ORDER.map((k) => {
          const v = c.funStats[k];
          const on = Math.round(v / 10);
          return (
            <div key={k} className="grid grid-cols-[76px_minmax(0,1fr)_30px] items-center gap-2 text-[13px]">
              <span>{k}</span>
              <span role="meter" aria-label={k} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="grid grid-cols-10 gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={`h-2.5 ${i < on ? "bg-gold-game" : "bg-[#3A3E55]"}`} />
                ))}
              </span>
              <span className="font-pixel text-xs text-right">{v}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3.5 text-[13px] leading-relaxed border-t-2 border-dashed border-[#4A4E66] pt-3">&quot;{c.modernComment}&quot;</p>

      <div className="flex justify-between mt-3 font-pixel text-[11px] text-[#C9BFA9]">
        <span>UNSE-AI.COM</span>
        <span className="font-sans">운명을 읽다</span>
      </div>
    </article>
  );
}

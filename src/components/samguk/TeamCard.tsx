import type { Ref } from "react";
import type { Team } from "@/lib/samguk/team";

const FUN_ORDER = ["칼퇴력", "술자리생존", "워라밸", "재테크", "꼰대력"] as const;

// 우리 팀 삼국지 결과 카드 (남색 게임 카드 톤, 캡처 한 장 완결)
export default function TeamCard({ team, captureRef }: { team: Team; captureRef?: Ref<HTMLElement> }) {
  return (
    <article ref={captureRef} className="bg-navy-game text-[#F4EAD5] border-4 border-[#F4EAD5] px-4 pt-[18px] pb-4 flex flex-col">
      <div className="flex justify-between font-pixel text-xs text-gold-game">
        <span>OUR TEAM</span>
        <span>{team.members.length} PLAYERS</span>
      </div>
      <h2 className="font-serif font-bold text-[26px] mt-2 break-keep">우리 팀은 {team.spirit}</h2>
      <ul className="grid grid-cols-3 gap-2 mt-3">
        {team.members.map((m, i) => (
          <li key={i} className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/samguk/${m.character.name}.jpg`} alt={`${m.character.name} 도트 초상화`} className="w-full aspect-[4/5] object-cover border-2 border-gold-game [image-rendering:pixelated]" />
            <span className="mt-1 text-[11px] bg-gold-game text-navy-game font-bold px-1.5">{m.role}</span>
            <span className="text-sm font-bold mt-0.5">{m.character.name}</span>
            {m.nickname && <span className="text-[11px] text-[#C9BFA9] truncate max-w-full">{m.nickname}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-3.5 font-pixel text-xs text-gold-game">▶ 팀 회사생활 STATUS</p>
      <div className="flex flex-col gap-1.5 mt-2">
        {FUN_ORDER.map((k) => {
          const v = team.funStats[k];
          return (
            <div key={k} className="grid grid-cols-[76px_minmax(0,1fr)_30px] items-center gap-2 text-[13px]">
              <span>{k}</span>
              <span role="meter" aria-label={k} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="grid grid-cols-10 gap-0.5">
                {Array.from({ length: 10 }, (_, i) => <span key={i} className={`h-2.5 ${i < Math.round(v / 10) ? "bg-gold-game" : "bg-[#3A3E55]"}`} />)}
              </span>
              <span className="font-pixel text-xs text-right">{v}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed border-t-2 border-dashed border-[#4A4E66] pt-3">{team.comment}</p>
      <div className="flex justify-between mt-3 font-pixel text-[11px] text-[#C9BFA9]">
        <span>UNSE-AI.COM</span>
        <span className="font-sans">운명을 읽다 · 우리 팀 삼국지</span>
      </div>
    </article>
  );
}

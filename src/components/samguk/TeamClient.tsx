"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import { Icon } from "@/components/icons";
import type { Gender } from "@/components/test/GenderPills";
import PhotoSlot from "@/components/faceMatch/PhotoSlot";
import ResultActions from "@/components/result/ResultActions";
import TeamCard from "@/components/samguk/TeamCard";
import { useScreenshot } from "@/hooks/useScreenshot";
import { useResultShare } from "@/hooks/useResultShare";
import { analyzePhoto, REASON_TEXT } from "@/lib/face/analyzePhoto";
import { matchCharacter } from "@/lib/samguk/matcher";
import calibration from "@/lib/samguk/calibration.json";
import { buildTeam } from "@/lib/samguk/team";
import type { SamgukCharacter } from "@/lib/samgukDB";
import { SITE, teamUrl } from "@/lib/shareLinks";
import { track } from "@/lib/analytics";
import { withGender, withPhoto } from "@/lib/faceMatch/slot";

interface Slot { nickname: string; gender: Gender | null; image: string | null; character: SamgukCharacter | null; error: string | null }
const empty = (): Slot => ({ nickname: "", gender: null, image: null, character: null, error: null });
const MAX = 6;

// 우리 팀 삼국지: 2~6명 사진 → 팀원별 닮은 장수 → 역할·팀의 기운·회사생활 STATUS. 사진은 폰 안에서만 분석한다.
export default function TeamClient() {
  const [slots, setSlots] = useState<Slot[]>([empty(), empty()]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { ref: cardRef, isCapturing, download } = useScreenshot<HTMLElement>();

  const set = (i: number, patch: Partial<Slot>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const ready = slots.every((s) => s.character || (s.image && s.gender));

  const team = useMemo(() => (done && slots.every((s) => s.character) ? buildTeam(slots.map((s) => ({ character: s.character!, nickname: s.nickname.trim() || undefined }))) : null), [done, slots]);
  const lord = team?.members.find((m) => m.role === "군주");
  const share = useResultShare(team && lord ? {
    testName: "team_samguk",
    title: "운명을 읽다 · 우리 팀 삼국지",
    text: `우리 팀은 ${team.spirit}! 너희 팀은 삼국지 속 누구야?`,
    url: teamUrl(team.members.map((m) => m.character.id)), // 별칭은 넣지 않는다
    imageUrl: `${SITE}/api/og/result?kind=team&ids=${team.members.map((m) => m.character.id).join("-")}`,
  } : null);

  const analyze = async () => {
    if (!ready || busy) return;
    setBusy(true);
    track("test_start", { test_name: "team_samguk" });
    const next: Slot[] = [];
    for (const s of slots) {
      if (s.character || !s.image || !s.gender) { next.push(s); continue; }
      const r = await analyzePhoto(s.image, s.gender);
      next.push(r.ok ? { ...s, character: matchCharacter(r.z, s.gender, calibration.bias).character, error: null } : { ...s, error: REASON_TEXT[r.reason] });
    }
    setSlots(next);
    setBusy(false);
    if (next.every((s) => s.character)) {
      setDone(true);
      const t = buildTeam(next.map((s) => ({ character: s.character! })));
      const l = t.members.find((m) => m.role === "군주")!;
      track("result_view", { test_name: "team_samguk", result_id: `${l.character.id}_${next.length}` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (team) {
    return (
      <div className="pb-6 animate-fade-in">
        <TeamCard team={team} captureRef={cardRef} />
        <ResultActions onShare={share.share} onSave={() => { track("share_click", { test_name: "team_samguk", method: "save_image" }); download({ fileName: "우리팀_삼국지" }); }} onRetry={() => { setDone(false); setSlots([empty(), empty()]); }} busy={share.busy || isCapturing} notice={share.notice} />
        <div className="mt-2"><CoupangBanner subId="samguk-team" /></div>
        <Link href="/samguk" className="mt-3 flex items-center gap-3 bg-card-2 rounded-[22px] p-4">
          <span className="w-11 h-11 rounded-full bg-paper grid place-items-center"><Icon name="fan" size={24} /></span>
          <span className="flex-1"><span className="block font-bold">나는 삼국지 속 누구?</span><span className="block text-xs text-muted mt-0.5">내 장수의 회사생활 스탯 자세히 보기</span></span>
          <Icon name="chevron" size={18} className="text-muted" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-7 no-screenshot">
      {slots.map((s, i) => (
        <PhotoSlot key={i} label={`${i + 1}번 팀원`} gender={s.gender} onGender={(g) => setSlots((all) => all.map((x, j) => (j === i ? withGender(x, g) : x)))} image={s.image} onFile={(d) => { setSlots((all) => all.map((x, j) => (j === i ? withPhoto(x, d) : x))); track("photo_selected", { test_name: "team_samguk" }); }} error={s.error}>
          <input value={s.nickname} onChange={(e) => set(i, { nickname: e.target.value.slice(0, 8) })} maxLength={8} placeholder="별칭 (선택, 예: 김대리)" aria-label={`${i + 1}번 팀원 별칭`} className="h-11 rounded-full border border-line bg-white px-4 text-sm" />
        </PhotoSlot>
      ))}
      <div className="flex gap-2">
        {slots.length < MAX && <button type="button" onClick={() => setSlots([...slots, empty()])} className="flex-1 h-12 rounded-full bg-white border border-line text-sm font-medium">한 명 더</button>}
        {slots.length > 2 && <button type="button" onClick={() => setSlots(slots.slice(0, -1))} className="flex-1 h-12 rounded-full bg-white border border-line text-sm font-medium">마지막 칸 빼기</button>}
      </div>
      <div className="flex items-center gap-2.5 bg-white rounded-[18px] px-3.5 py-3">
        <Icon name="shield" size={20} className="text-accent flex-none" />
        <span className="text-xs leading-normal text-muted">팀원 사진은 내 폰 안에서만 보고 바로 지워요. 별칭은 저장 이미지에만 나오고 공유 링크에는 들어가지 않아요.</span>
      </div>
      <button type="button" onClick={analyze} disabled={!ready || busy} className="h-[52px] rounded-full bg-ink text-paper text-[15px] font-medium disabled:opacity-45">
        {busy ? "장수 찾는 중…" : ready ? "우리 팀 결과 보기" : "모든 팀원의 성별과 사진을 골라 주세요"}
      </button>
    </div>
  );
}

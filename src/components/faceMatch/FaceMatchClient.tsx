"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import { Icon } from "@/components/icons";
import type { Gender } from "@/components/test/GenderPills";
import ResultActions from "@/components/result/ResultActions";
import FaceMatchCard from "@/components/faceMatch/FaceMatchCard";
import PhotoSlot from "@/components/faceMatch/PhotoSlot";
import { useScreenshot } from "@/hooks/useScreenshot";
import { useResultShare } from "@/hooks/useResultShare";
import { analyzePhoto, REASON_TEXT } from "@/lib/face/analyzePhoto";
import { matchAnimal, ANIMAL_KEYS, type AnimalKey } from "@/lib/animal/matcher";
import animalCalibration from "@/lib/animal/calibration.json";
import { faceMatch, REL, REL_NAME, type Rel } from "@/lib/faceMatch/compat";
import { faceMatchInviteUrl, faceMatchUrl, josa, SITE } from "@/lib/shareLinks";
import { animalTypeDB } from "@/lib/animalTypeDB";
import { track } from "@/lib/analytics";
import { withGender, withPhoto } from "@/lib/faceMatch/slot";

interface Slot { gender: Gender | null; image: string | null; animal: AnimalKey | null; error: string | null }
const empty: Slot = { gender: null, image: null, animal: null, error: null };

const OTHER_LABEL: Record<Rel, string> = { friend: "친구", lover: "내 사람", crush: "그 사람" };

// 얼굴 궁합: 관계를 고르고 두 얼굴의 동물상으로 궁합을 본다.
// - 한 폰: 두 칸 모두 사진
// - ?me=cat: 내 동물상 결과로 시작(사진 다시 안 받음), 그 사람 사진을 올리거나 친구에게 초대 링크를 보낸다
// - invite: 초대 링크로 들어온 사람. 상대(초대한 친구) 칸은 결과로 채워져 있고, 내 사진만 올린다
export default function FaceMatchClient({ invite }: { invite?: { key: AnimalKey; rel: "friend" | "lover" } }) {
  const [rel, setRel] = useState<Rel | null>(invite?.rel ?? null);
  const [me, setMe] = useState<Slot>(empty);
  const [other, setOther] = useState<Slot>(invite ? { ...empty, animal: invite.key } : empty);
  const [meFixed, setMeFixed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { ref: cardRef, isCapturing, download } = useScreenshot<HTMLElement>();

  // 동물상 결과에서 넘어온 경우(?me=cat) 내 칸을 결과로 채운다
  useEffect(() => {
    if (invite) return;
    const q = new URLSearchParams(window.location.search).get("me") ?? "";
    if ((ANIMAL_KEYS as readonly string[]).includes(q)) {
      setMe({ ...empty, animal: q as AnimalKey });
      setMeFixed(true);
    }
  }, [invite]);

  const result = done && rel && me.animal && other.animal ? faceMatch(me.animal, other.animal, rel) : null;

  const resultMeta = useMemo(() => {
    if (!result || !rel || !me.animal || !other.animal) return null;
    const text = rel === "crush" ? `나 짝사랑 성공 가능성 ${result.score}% 나왔어. 너도 해볼래?` : `우리 ${REL_NAME[rel]} 궁합 ${result.score}점이래. 너희도 해볼래?`;
    return { testName: "face_match" as const, title: "운명을 읽다 · 얼굴 궁합", text, url: faceMatchUrl(me.animal, other.animal, rel), imageUrl: `${SITE}/api/og/result?kind=face-match&a=${me.animal}&b=${other.animal}&rel=${rel}` };
  }, [result, rel, me.animal, other.animal]);
  const resultShare = useResultShare(resultMeta);

  const inviteUrl = meFixed && me.animal && rel ? faceMatchInviteUrl(me.animal, rel) : null;
  const inviteShare = useResultShare(inviteUrl && me.animal ? { testName: "face_match", title: "운명을 읽다 · 얼굴 궁합", text: `나는 ${animalTypeDB[me.animal].name}이야. 우리 ${REL_NAME[rel!]} 궁합 볼래?`, url: inviteUrl, imageUrl: `${SITE}/api/og/result?kind=invite&key=${me.animal}&rel=${rel}` } : null);

  const needs = (s: Slot) => !s.animal && !!s.image && !!s.gender;
  const ready = !!rel && (me.animal || (me.image && me.gender)) && (other.animal || (other.image && other.gender));

  const analyze = async () => {
    if (!rel || !ready || busy) return;
    setBusy(true);
    track("test_start", { test_name: "face_match" });
    const run = async (s: Slot): Promise<Slot> => {
      if (!needs(s)) return s;
      const r = await analyzePhoto(s.image!, s.gender!);
      return r.ok ? { ...s, animal: matchAnimal(r.z, animalCalibration.bias).type, error: null } : { ...s, error: REASON_TEXT[r.reason] };
    };
    const [m, o] = [await run(me), await run(other)];
    setMe(m);
    setOther(o);
    setBusy(false);
    if (m.animal && o.animal) {
      setDone(true);
      track("result_view", { test_name: "face_match", result_id: `${m.animal}_${o.animal}_${rel}` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const retry = () => {
    setDone(false);
    if (!invite) setOther(empty);
    if (!meFixed) setMe(empty);
  };

  if (result && rel && me.animal && other.animal) {
    return (
      <div className="pb-6 animate-fade-in">
        <FaceMatchCard captureRef={cardRef} a={me.animal} b={other.animal} rel={rel} result={result} />
        <ResultActions onShare={resultShare.share} onSave={() => { track("share_click", { test_name: "face_match", method: "save_image" }); download({ fileName: `얼굴궁합_${REL_NAME[rel]}` }); }} onRetry={retry} busy={resultShare.busy || isCapturing} notice={resultShare.notice} />
        <div className="mt-2"><CoupangBanner subId="face-match" /></div>
        <Link href="/animal" className="mt-3 flex items-center gap-3 bg-card-2 rounded-[22px] p-4">
          <span className="w-11 h-11 rounded-full bg-paper grid place-items-center"><Icon name="cat" size={24} /></span>
          <span className="flex-1"><span className="block font-bold">내 동물상 자세히 보기</span><span className="block text-xs text-muted mt-0.5">성격·연애 스타일·잘 맞는 동물상</span></span>
          <Icon name="chevron" size={18} className="text-muted" />
        </Link>
      </div>
    );
  }

  const otherLabel = rel ? OTHER_LABEL[rel] : "상대";
  return (
    <div className="flex flex-col gap-4 pb-7 no-screenshot">
      {invite ? (
        <p className="bg-card rounded-[22px] p-4 text-sm leading-relaxed">
          <b>{invite.rel === "lover" ? "내 사람이 연인 궁합을 보자고 해요." : "친구가 궁합을 보자고 해요."}</b> {josa(OTHER_LABEL[invite.rel], "은", "는")} {animalTypeDB[invite.key].name}이에요. 내 사진을 올리면 바로 궁합이 나와요.
        </p>
      ) : (
        <fieldset>
          <legend className="text-[13px] text-muted mb-2.5">어떤 사이예요?</legend>
          <div role="radiogroup" aria-label="관계" className="grid grid-cols-3 gap-2">
            {REL.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={rel === r} onClick={() => setRel(r)} className={`h-12 rounded-full border text-[15px] font-medium transition ${rel === r ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line"}`}>
                {REL_NAME[r]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <PhotoSlot label="나" gender={me.gender} onGender={(g) => setMe(withGender(me, g))} image={me.image} onFile={(d) => { setMe(withPhoto(me, d)); track("photo_selected", { test_name: "face_match" }); }} error={me.error} fixed={meFixed ? me.animal ?? undefined : undefined} />

      {inviteUrl && (
        <div className="bg-white border border-line rounded-[22px] p-4 flex flex-col gap-2">
          <p className="text-sm">{OTHER_LABEL[rel!]}도 자기 사진으로 해 보게 할까요?</p>
          <button type="button" onClick={inviteShare.share} disabled={inviteShare.busy} className="h-12 rounded-full bg-ink text-paper text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Icon name="share" size={16} /> {OTHER_LABEL[rel!]}에게 초대 링크 보내기
          </button>
          {inviteShare.notice && <p role="status" className="text-xs text-muted text-center">{inviteShare.notice}</p>}
          <p className="text-xs text-muted text-center">또는 아래에 {OTHER_LABEL[rel!]} 사진을 올려도 돼요</p>
        </div>
      )}

      <PhotoSlot label={otherLabel} gender={other.gender} onGender={(g) => setOther(withGender(other, g))} image={other.image} onFile={(d) => { setOther(withPhoto(other, d)); track("photo_selected", { test_name: "face_match" }); }} error={other.error} fixed={invite ? invite.key : undefined} />

      <div className="flex items-center gap-2.5 bg-white rounded-[18px] px-3.5 py-3">
        <Icon name="shield" size={20} className="text-accent flex-none" />
        <span className="text-xs leading-normal text-muted">
          {rel === "crush" ? "그 사람 사진도 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않고, 상대에게 알림도 가지 않아요." : "사진은 내 폰 안에서만 보고 바로 지워요. 어디에도 올라가지 않아요."}
        </span>
      </div>
      <button type="button" onClick={analyze} disabled={!ready || busy} className="h-[52px] rounded-full bg-ink text-paper text-[15px] font-medium disabled:opacity-45">
        {busy ? "궁합 보는 중…" : !rel ? "어떤 사이인지 먼저 골라 주세요" : "궁합 보기"}
      </button>
    </div>
  );
}

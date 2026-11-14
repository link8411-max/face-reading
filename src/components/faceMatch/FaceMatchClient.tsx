"use client";

import AnalyzingOverlay, { useAnalyzeStep } from "@/components/test/AnalyzingOverlay";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import { Icon } from "@/components/icons";
import type { Gender } from "@/components/test/GenderPills";
import ResultActions from "@/components/result/ResultActions";
import FaceMatchCard from "@/components/faceMatch/FaceMatchCard";
import StartTabs, { GUIDE_TAB } from "@/components/test/StartTabs";
import PhotoSlot from "@/components/faceMatch/PhotoSlot";
import { loadGender, saveGender } from "@/lib/genderMemory";
import { useScreenshot } from "@/hooks/useScreenshot";
import { useResultShare } from "@/hooks/useResultShare";
import { analyzePhoto, failText } from "@/lib/face/analyzePhoto";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";
import { localePath } from "@/lib/i18n/locales";
import { REL_NAME as EN_REL_NAME } from "@/content/en/faceMatch";
import { SHARE_PHRASE } from "@/content/en/share";
import { matchAnimal, ANIMAL_KEYS, type AnimalKey } from "@/lib/animal/matcher";
import animalCalibration from "@/lib/animal/calibration.json";
import { faceMatch, REL, REL_NAME, type Rel } from "@/lib/faceMatch/compat";
import { faceMatchInviteUrl, faceMatchUrl, josa, SITE } from "@/lib/shareLinks";
import { animalTypeDB } from "@/lib/animalTypeDB";
import { track } from "@/lib/analytics";
import { withGender, withPhoto } from "@/lib/faceMatch/slot";
import { useScrollTopWhen } from "@/hooks/useScrollTopWhen";
import type { ReactNode } from "react";

interface Slot { gender: Gender | null; image: string | null; animal: AnimalKey | null; error: string | null }
const empty: Slot = { gender: null, image: null, animal: null, error: null };

const OTHER_LABEL: Record<Rel, string> = { friend: "친구", lover: "내 사람", crush: "그 사람" };

// 얼굴 궁합: 관계를 고르고 두 얼굴의 동물상으로 궁합을 본다.
// - 한 폰: 두 칸 모두 사진
// - ?me=cat: 내 동물상 결과로 시작(사진 다시 안 받음), 그 사람 사진을 올리거나 친구에게 초대 링크를 보낸다
// - invite: 초대 링크로 들어온 사람. 상대(초대한 친구) 칸은 결과로 채워져 있고, 내 사진만 올린다
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// top: 시작 화면의 캐릭터 머리(제목 포함, 결과가 나오면 사라진다), head: 결과 화면의 제목. 둘 다 서버에서 그려 HTML에 들어간다.
// intro: 시작 화면 "설명" 탭에 들어가는 소개 문장(11/14 스크롤 줄이기로 제목 아래에서 옮김)
export default function FaceMatchClient({ invite, top, head, intro }: { invite?: { key: AnimalKey; rel: "friend" | "lover" }; top?: ReactNode; head?: ReactNode; intro?: ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const en = locale === "en";
  const enAnimals = useEnCopy()?.animals;
  const enText = en && enAnimals ? { animals: enAnimals } : undefined;
  const relName = en ? EN_REL_NAME : REL_NAME;
  const otherLabelOf = (r: Rel) => (en ? t(r === "friend" ? "fm.otherFriend" : r === "lover" ? "fm.otherLover" : "fm.otherCrush") : OTHER_LABEL[r]);
  const FACE_MATCH_STEPS = [t("fm.step1"), t("fm.step2"), t("fm.step3")];
  const [rel, setRel] = useState<Rel | null>(invite?.rel ?? null);
  const [me, setMe] = useState<Slot>(empty);
  const [other, setOther] = useState<Slot>(invite ? { ...empty, animal: invite.key } : empty);
  const [meFixed, setMeFixed] = useState(false);
  // "나" 칸은 다른 사진 테스트에서 고른 내 성별을 미리 고른다 (상대 칸은 비워 둔다)
  useEffect(() => {
    const g = loadGender();
    if (g) setMe((cur) => (cur.gender ? cur : { ...cur, gender: g }));
  }, []);
  // 시작 화면에서 얼굴 인식 모델을 미리 받아 둔다(분석 버튼을 누를 때 기다리지 않게)
  useEffect(() => {
    import("@/lib/face/mediapipe").then((m) => m.prepareLandmarker()).catch(() => {});
  }, []);
  const [busy, setBusy] = useState(false);
  const analyzeStep = useAnalyzeStep(busy, FACE_MATCH_STEPS.length);
  const running = useRef(false);
  const [done, setDone] = useState(false);
  useScrollTopWhen(done);
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

  const result = done && rel && me.animal && other.animal ? faceMatch(me.animal, other.animal, rel, enText) : null;

  const resultMeta = useMemo(() => {
    if (!result || !rel || !me.animal || !other.animal) return null;
    const text = en ? SHARE_PHRASE.faceMatch(rel, EN_REL_NAME[rel], result.score) : rel === "crush" ? `나 짝사랑 성공 가능성 ${result.score}% 나왔어. 너도 해볼래?` : `우리 ${REL_NAME[rel]} 궁합 ${result.score}점이래. 너희도 해볼래?`;
    return { testName: "face_match" as const, title: t("fm.shareTitle"), text, url: faceMatchUrl(me.animal, other.animal, rel, locale), imageUrl: `${SITE}/api/og/result?kind=face-match&a=${me.animal}&b=${other.animal}&rel=${rel}${en ? "&lang=en" : ""}` };
  }, [result, rel, me.animal, other.animal, locale]);
  const resultShare = useResultShare(resultMeta);

  // 초대 링크 착지(/face-match/i)는 한국어만 있으므로 영어판에서는 만들지 않는다
  const inviteUrl = !en && meFixed && me.animal && rel ? faceMatchInviteUrl(me.animal, rel) : null;
  const inviteShare = useResultShare(inviteUrl && me.animal ? { testName: "face_match", title: t("fm.shareTitle"), text: `나는 ${animalTypeDB[me.animal].name}이야. 우리 ${REL_NAME[rel!]} 궁합 볼래?`, url: inviteUrl, imageUrl: `${SITE}/api/og/result?kind=invite&key=${me.animal}&rel=${rel}` } : null);

  const needs = (s: Slot) => !s.animal && !!s.image && !!s.gender;
  const ready = !!rel && (me.animal || (me.image && me.gender)) && (other.animal || (other.image && other.gender));

  const analyze = async () => {
    if (!rel || !ready || running.current) return;
    running.current = true; // 빠른 두 번 누르기도 한 번만
    setBusy(true);
    track("test_start", { test_name: "face_match" });
    const run = async (s: Slot): Promise<Slot> => {
      if (!needs(s)) return s;
      const r = await analyzePhoto(s.image!, s.gender!);
      if (!r.ok) track("photo_fail", { test_name: "face_match", result_id: r.reason });
      return r.ok ? { ...s, animal: matchAnimal(r.z, animalCalibration.bias).type, error: null } : { ...s, error: failText(r, locale) };
    };
    const [m, o] = [await run(me), await run(other)];
    setMe(m);
    setOther(o);
    setBusy(false);
    running.current = false;
    if (m.animal && o.animal) {
      setDone(true);
      track("result_view", { test_name: "face_match", result_id: `${m.animal}_${o.animal}_${rel}` });
    }
  };

  const retry = () => {
    setDone(false);
    if (!invite) setOther(empty);
    if (!meFixed) setMe(empty);
  };

  if (result && rel && me.animal && other.animal) {
    return (
      <>
      {head}
      <div className="pb-6 animate-fade-in">
        <FaceMatchCard captureRef={cardRef} a={me.animal} b={other.animal} rel={rel} result={result} />
        <ResultActions from="face_match" onShare={resultShare.share} onSave={() => { track("share_click", { test_name: "face_match", method: "save_image" }); download({ fileName: `${t("fm.file")}_${relName[rel]}` }); }} onRetry={retry} busy={resultShare.busy || isCapturing} notice={resultShare.notice} />
        {!en && <div className="mt-2"><CoupangBanner subId="face-match" /></div>}
        <Link href={localePath(locale, "/animal")} className="mt-3 flex items-center gap-3 bg-card-2 rounded-[22px] p-4">
          <span className="w-11 h-11 rounded-full bg-paper grid place-items-center"><Icon name="cat" size={24} /></span>
          <span className="flex-1"><span className="block font-bold">{t("fm.toAnimal")}</span><span className="block text-xs text-muted mt-0.5">{t("fm.toAnimalSub")}</span></span>
          <Icon name="chevron" size={18} className="text-muted" />
        </Link>
      </div>
      </>
    );
  }

  const otherLabel = rel ? (en ? cap(otherLabelOf(rel)) : OTHER_LABEL[rel]) : (en ? cap(t("fm.otherDefault")) : "상대");
  return (
    <>
    {top}
    <div className="pb-7 no-screenshot">
    <StartTabs className="mt-3.5" tabs={[{ key: "test", label: t("fm.tabTest"), content: (
    <div className="flex flex-col gap-2.5 mt-3">
      {invite ? (
        <p className="bg-card border border-line rounded-[22px] p-4 text-sm leading-relaxed">
          <b>{invite.rel === "lover" ? "내 사람이 연인 궁합을 보자고 해요." : "친구가 궁합을 보자고 해요."}</b> {josa(OTHER_LABEL[invite.rel], "은", "는")} {animalTypeDB[invite.key].name}이에요. 내 사진을 올리면 바로 궁합이 나와요.
        </p>
      ) : (
        <fieldset>
          <legend className="sr-only">{t("fm.relQuestion")}</legend>
          <div role="radiogroup" aria-label={t("fm.relAria")} className="grid grid-cols-3 gap-2">
            {REL.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={rel === r} disabled={busy} onClick={() => setRel(r)} className={`h-12 rounded-full border text-[15px] font-medium transition disabled:opacity-60 ${rel === r ? "bg-ink text-paper border-ink" : "bg-card text-ink border-line"}`}>
                {relName[r]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <PhotoSlot compact label={t("fm.me")} gender={me.gender} onGender={(g) => { setMe(withGender(me, g)); saveGender(g); }} image={me.image} onFile={(d) => { setMe(withPhoto(me, d)); track("photo_selected", { test_name: "face_match" }); }} error={me.error} disabled={busy} fixed={meFixed ? me.animal ?? undefined : undefined} />
        <PhotoSlot compact label={otherLabel} gender={other.gender} onGender={(g) => setOther(withGender(other, g))} image={other.image} onFile={(d) => { setOther(withPhoto(other, d)); track("photo_selected", { test_name: "face_match" }); }} error={other.error} disabled={busy} fixed={invite ? invite.key : undefined} />
      </div>

      {inviteUrl && (
        <div className="bg-card border border-line rounded-[22px] p-4 flex flex-col gap-2">
          <p className="text-sm">{OTHER_LABEL[rel!]}도 자기 사진으로 해 보게 할까요?</p>
          <button type="button" onClick={inviteShare.share} disabled={inviteShare.busy} className="h-12 rounded-full bg-accent text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Icon name="share" size={16} /> {OTHER_LABEL[rel!]}에게 초대 링크 보내기
          </button>
          {inviteShare.notice && <p role="status" className="text-xs text-muted text-center">{inviteShare.notice}</p>}
          <p className="text-xs text-muted text-center">또는 위 칸에 {OTHER_LABEL[rel!]} 사진을 올려도 돼요</p>
        </div>
      )}

      {busy && <AnalyzingOverlay cast="gumiho" steps={FACE_MATCH_STEPS} step={analyzeStep} />}
      <button type="button" onClick={analyze} disabled={!ready || busy} className="h-[52px] rounded-full bg-accent text-white text-[15px] font-medium disabled:opacity-45">
        {busy ? t("fm.going") : !rel ? t("fm.needRel") : t("fm.go")}
      </button>
      <div className="-mt-1 flex items-center gap-2 px-1">
        <Icon name="shield" size={16} className="text-accent-ink flex-none" />
        <span className="text-xs leading-normal text-muted">
          {rel === "crush" ? t("fm.privacyCrush") : t("fm.privacy")}
        </span>
      </div>
    </div>
    ) }, { key: GUIDE_TAB, label: t("start.tabGuide"), content: intro }]} />
    </div>
    </>
  );
}

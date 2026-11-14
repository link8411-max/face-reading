"use client";

import { track } from "@/lib/analytics";
import { useState, useRef, useEffect } from "react";
import { useRememberedGender } from "@/hooks/useRememberedGender";
import { useGenderGuess } from "@/hooks/useGenderGuess";
import { preloadGenderModels } from "@/lib/face/genderGuess";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import { useScreenshot } from "@/hooks/useScreenshot";
import ResultActions from "@/components/result/ResultActions";
import CoupangBanner from "@/components/CoupangBanner";
import NextTests from "@/components/result/NextTests";
import MoreTests from "@/components/MoreTests";
import NextSteps from "@/components/result/NextSteps";
import GuansangResultView from "@/components/face/GuansangResultView";
import RevealMotion from "@/components/face/RevealMotion";
import { useHandedPhoto } from "@/hooks/useHandedPhoto";
import { useResultShare } from "@/hooks/useResultShare";
import { analyzePhotoDetailed, failText, holdAtLeast, reasonText } from "@/lib/face/analyzePhoto";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { useEnCopy } from "@/lib/i18n/copy";
import { SHARE_PHRASE } from "@/content/en/share";
import { classifyGuansang, type GuansangResult } from "@/lib/face/guansang";
import type { Landmark } from "@/lib/face/landmarkFeatures";
import { GUANSANG_TYPES } from "@/content/guansang";
import { ogImageUrl, parseShared, shareUrl } from "@/lib/shareLinks";
import { useScrollTopWhen } from "@/hooks/useScrollTopWhen";
import { artGender, type ArtGender } from "@/lib/animal/art";
import { faceArt } from "@/lib/art";
import { GUANSANG_TYPE_KEYS } from "@/lib/face/guansangKeys";
import ResultPreview from "@/components/test/ResultPreview";

// 결과 상태: 랜드마크는 Task 7의 공개 모션이 쓴다(화면 밖으로 나가지 않는다)
interface FaceState { guansang: GuansangResult; landmarks: Landmark[]; image: string; zones: { up: number; mid: number; down: number }; g: ArtGender }

export default function Face2Page() {
  const goBack = useBackOrHome();
  const t = useT();
  const locale = useLocale();
  const en = locale === "en";
  const enG = useEnCopy()?.guansang;
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaceState | null>(null);
  useScrollTopWhen(result);
  const [revealed, setRevealed] = useState(false); // 공개 모션이 끝나야 결과 카드를 보인다
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useRememberedGender();
  useGenderGuess(image, gender, setGender);
  // 기억된 성별이 없으면 추정 모델을 미리 받아 둔다(사진을 고르자마자 추정할 수 있게)
  useEffect(() => { if (!gender) preloadGenderModels(); }, [gender]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const type = result?.guansang.type;
  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>();
  const { busy, notice, share: shareCard } = useResultShare(
    type ? { testName: "face", title: t("face.shareTitle"), text: en && enG ? SHARE_PHRASE.face(enG.types[type].nickname) : parseShared("face", type)!.phrase, url: shareUrl("face", type, undefined, locale, { g: result?.g }), imageUrl: ogImageUrl("face", type, undefined, undefined, locale) } : null,
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      import("@/lib/face/mediapipe").then((m) => m.prepareLandmarker()).catch(() => {});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      track("photo_selected", { test_name: "face" });
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !gender) return;
    setLoading(true);
    track("test_start", { test_name: "face" });
    setError(null);
    const t0 = Date.now();
    try {
      const r = await analyzePhotoDetailed(image, gender);
      if (!r.ok) {
        track("photo_fail", { test_name: "face", result_id: r.reason });
        await holdAtLeast(t0);
        setError(failText(r, locale));
        return;
      }
      const guansang = classifyGuansang({ z: r.z, g: r.g, zones: r.zones });
      setRevealed(false);
      setResult({ guansang, landmarks: r.landmarks, image, zones: r.zones, g: artGender(gender) });
      track("result_view", { test_name: "face", result_id: guansang.type });
    } catch (err) {
      console.error("Analysis error:", err);
      track("photo_fail", { test_name: "face", result_id: "read" });
      setError(reasonText("read", locale));
    } finally {
      setLoading(false);
    }
  };

  // 다른 사진 테스트에서 같은 사진으로 넘어오면 바로 분석
  useHandedPhoto(setImage, !!image && !!gender, () => void analyzeImage());

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setRevealed(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg">
        <TestHeader title={t("face.title")} onBack={() => (result ? resetAll() : goBack())} backLabel={result ? t("btn.tryAgain") : t("btn.back")} cast={result ? undefined : { cast: "haetae", line: "say.face2.start", heading: t("face.heading") }} />

        {!result && (
          <TestStart
            testTab={t("start.tabFace")}
            desc={t("face.desc")}
            tips={[t("face.tip1"), t("face.tip2")]}
            analyzeLabel={t("face.analyze")}
            image={image}
            gender={gender}
            onGender={setGender}
            onFile={handleImageUpload}
            onAnalyze={analyzeImage}
            onReset={resetAll}
            loading={loading}
            error={error}
            imageRef={imageRef}
            preview={
              <ResultPreview
                title={t("preview.title")}
                items={GUANSANG_TYPE_KEYS.map((k) => ({ key: k, src: faceArt(k, artGender(gender)).src, name: (enG?.types ?? GUANSANG_TYPES)[k].nickname }))}
              />
            }
          />
        )}

        {result && !revealed && (
          <RevealMotion
            imageUrl={result.image}
            landmarks={result.landmarks}
            zones={result.zones}
            dominant={result.guansang.zone}
            palaces={result.guansang.palaces}
            onDone={() => setRevealed(true)}
          />
        )}

        {result && revealed && (
          <>
            <GuansangResultView
              result={result.guansang}
              g={result.g}
              captureRef={resultRef}
              actions={
                <ResultActions
                  from="face"
                  onShare={shareCard}
                  onSave={() => {
                    track("share_click", { test_name: "face", method: "save_image" });
                    const ty = (enG?.types ?? GUANSANG_TYPES)[result.guansang.type];
                    download({ fileName: `${t("face.file")}_${ty.nickname}`, shareTitle: `${t("face.saveTitle")}: ${ty.nickname}`, shareText: ty.oneLiner });
                  }}
                  onRetry={resetAll}
                  busy={busy || isCapturing}
                  notice={notice}
                />
              }
              after={
                <>
                  {!en && <div className="mt-2"><CoupangBanner subId="face" /></div>}
                  <NextTests current="face" image={result.image} />
                  {!en && <NextSteps from="face" withPhoto />}
                  <MoreTests current={en ? "/en/face2" : "/face2"} locale={locale} />
                </>
              }
            />
          </>
        )}

        <p className="text-center text-muted text-xs mt-6 pb-4">{t("result.disclaimer")}</p>
      </main>
    </div>
  );
}

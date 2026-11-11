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
import NextSteps from "@/components/result/NextSteps";
import GuansangResultView from "@/components/face/GuansangResultView";
import RevealMotion from "@/components/face/RevealMotion";
import { useHandedPhoto } from "@/hooks/useHandedPhoto";
import { useResultShare } from "@/hooks/useResultShare";
import { analyzePhotoDetailed, failText, holdAtLeast, REASON_TEXT } from "@/lib/face/analyzePhoto";
import { classifyGuansang, type GuansangResult } from "@/lib/face/guansang";
import type { Landmark } from "@/lib/face/landmarkFeatures";
import { GUANSANG_TYPES } from "@/content/guansang";
import { ogImageUrl, parseShared, shareUrl } from "@/lib/shareLinks";

// 결과 상태: 랜드마크는 Task 7의 공개 모션이 쓴다(화면 밖으로 나가지 않는다)
interface FaceState { guansang: GuansangResult; landmarks: Landmark[]; image: string; zones: { up: number; mid: number; down: number } }

export default function Face2Page() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FaceState | null>(null);
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
    type ? { testName: "face", title: "운명을 읽다 · AI 관상 테스트", text: parseShared("face", type)!.phrase, url: shareUrl("face", type), imageUrl: ogImageUrl("face", type) } : null,
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
        setError(failText(r));
        return;
      }
      const guansang = classifyGuansang({ z: r.z, g: r.g, zones: r.zones });
      setRevealed(false);
      setResult({ guansang, landmarks: r.landmarks, image, zones: r.zones });
      track("result_view", { test_name: "face", result_id: guansang.type });
    } catch (err) {
      console.error("Analysis error:", err);
      track("photo_fail", { test_name: "face", result_id: "read" });
      setError(REASON_TEXT.read);
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
        <TestHeader title="AI 관상 테스트" onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />

        {!result && (
          <TestStart
            heading={"웃는 사진 한 장이면\n충분해요"}
            desc="사진 한 장으로 보는 무료 관상이에요. 얼굴형 5가지와 힘이 실린 자리 3곳으로 15가지 상을 나누고, 돈·일·사랑·사람·버팀 다섯 자리를 풀어드려요."
            tips={["앞머리는 살짝 넘겨주세요", "밝은 곳에서"]}
            analyzeLabel="관상 보기"
            image={image}
            gender={gender}
            onGender={setGender}
            onFile={handleImageUpload}
            onAnalyze={analyzeImage}
            onReset={resetAll}
            loading={loading}
            error={error}
            imageRef={imageRef}
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
              captureRef={resultRef}
              actions={
                <ResultActions
                  from="face"
                  onShare={shareCard}
                  onSave={() => {
                    track("share_click", { test_name: "face", method: "save_image" });
                    const t = GUANSANG_TYPES[result.guansang.type];
                    download({ fileName: `관상_${t.nickname}`, shareTitle: `나의 관상: ${t.nickname}`, shareText: t.oneLiner });
                  }}
                  onRetry={resetAll}
                  busy={busy || isCapturing}
                  notice={notice}
                />
              }
              after={
                <>
                  <div className="mt-2"><CoupangBanner subId="face" /></div>
                  <NextTests current="face" image={result.image} />
                  <NextSteps from="face" withPhoto />
                </>
              }
            />
          </>
        )}

        <p className="text-center text-muted text-xs mt-6 pb-4">재미로만 봐 주세요. 과학적 근거는 없어요.</p>
      </main>
    </div>
  );
}

"use client";

import { track } from "@/lib/analytics";
import { useState, useRef } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import type { Gender } from "@/components/test/GenderPills";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";
import { matchAnimal, type AnimalTypeResult } from "@/lib/animal/matcher";
import animalCalibration from "@/lib/animal/calibration.json";
import { toZ } from "@/lib/face/featureStats";
import { animalTypeDB } from "@/lib/animalTypeDB";
import ResultCard, { type ResultCardProps } from "@/components/result/ResultCard";
import ResultActions from "@/components/result/ResultActions";
import { useResultShare } from "@/hooks/useResultShare";
import { Icon } from "@/components/icons";

const firstSentence = (t: string) => (t.match(/^.*?[.!?요다](?=\s|$)/)?.[0] ?? t).trim();

// 결과 카드: 동물상은 숫자 특성이 없어서 막대 대신 성격 칩 3개를 쓴다
function cardProps(r: AnimalTypeResult): ResultCardProps {
  return {
    eyebrow: `${r.data.name} · 닮음 ${r.matchScore}%`,
    title: r.data.title,
    summary: firstSentence(r.data.description),
    chips: r.data.personality.positive.slice(0, 3),
    reasons: [
      { label: "매력", text: r.data.charm },
      { label: "얼굴", text: `${r.features.눈} · 얼굴형 ${r.features.얼굴형}` },
    ],
  };
}

export default function AnimalTypePage() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnimalTypeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 성별: 성별별 얼굴 기준값으로 z 점수를 낸다
  const [gender, setGender] = useState<Gender | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>();
  const { busy, notice, share: shareCard } = useResultShare(resultRef, result ? { fileName: `동물상_${result.data.name}`, title: `나의 동물상: ${result.data.name}`, text: `나는 ${result.data.name}이래요 (닮음 ${result.matchScore}%). 무료 동물상 테스트` } : null);

  const getShareOptions = () => ({
    fileName: `동물상_${result?.data.name || "결과"}`,
    shareTitle: `나의 동물상: ${result?.data.name}`,
    shareText: `${result?.data.title} - ${result?.data.charm}`,
  });

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
      track("photo_selected", { test_name: "animal" });
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    const img = imageRef.current;
    if (!image || !gender || !img) return;

    setLoading(true);
    track("test_start", { test_name: "animal" });
    setError(null);
    try {
      await img.decode().catch(() => {});
      const { extractFeatures, checkFrontal } = await import("@/lib/face/landmarkFeatures");
      // 모델·WASM을 못 받은 경우(오프라인, CDN 차단)는 사진 문제가 아니라 도구 문제로 안내한다
      let lm;
      try {
        const { detectLandmarks } = await import("@/lib/face/mediapipe");
        lm = await detectLandmarks(img);
      } catch {
        setError("분석 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.");
        return;
      }
      if (!lm) {
        setError("얼굴을 찾지 못했어요. 얼굴이 잘 보이는 사진을 올려 주세요.");
        return;
      }
      if (!checkFrontal(lm).ok) {
        setError("정면 사진을 올려 주세요. 고개를 돌린 사진은 동물상을 찾기 어려워요.");
        return;
      }
      const features = extractFeatures(lm);
      const matched = matchAnimal(toZ(features, gender), animalCalibration.bias);
      setResult(matched);
      track("result_view", { test_name: "animal", result_id: matched.type });
    } catch (err) {
      console.error("Analysis error:", err);
      setError("사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">

      <main className="mx-auto px-[22px] max-w-lg">
        <TestHeader title="동물상 테스트" onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />

        {!result && (
          <TestStart
            heading={"나는 어떤 동물을\n닮았을까?"}
            desc="눈매와 얼굴형으로 강아지상, 고양이상, 여우상 중 가장 닮은 동물을 찾아요."
            tips={["정면 사진이 좋아요", "밝은 곳에서"]}
            analyzeLabel="동물상 찾기"
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

        {/* Result Section */}
        {result && (
          <div className="pb-6 animate-fade-in">
            <ResultCard captureRef={resultRef} {...cardProps(result)} />
            <ResultActions
              onShare={() => { track("share_click", { test_name: "animal", method: "share" }); shareCard(); }}
              onSave={() => { track("share_click", { test_name: "animal", method: "save_image" }); download(getShareOptions()); }}
              onRetry={resetAll}
              busy={busy || isCapturing}
              notice={notice}
            />
            <div className="mt-2">
              <CoupangBanner subId="animal" />
            </div>

            <details className="group mt-4 bg-white border border-line rounded-[22px] px-5 py-4">
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                풀이 자세히 보기
                <Icon name="chevron" size={18} className="text-muted transition group-open:rotate-90" />
              </summary>
              <div className="mt-4 space-y-5 text-sm leading-relaxed">
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">{result.data.title}</h3>
                  <p>{result.data.description}</p>
                  {result.secondaryType && (
                    <p className="text-muted text-xs mt-2">{animalTypeDB[result.secondaryType].name} 느낌도 있어요</p>
                  )}
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">분석된 얼굴 특징</h3>
                  <dl className="grid grid-cols-2 gap-2">
                    {Object.entries(result.features).map(([부위, 설명]) => (
                      <div key={부위} className="bg-card-2 rounded-[18px] p-3 text-center">
                        <dt className="text-xs text-muted">{부위}</dt>
                        <dd className="font-medium mt-0.5">{설명}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">성격</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.personality.positive.map((t) => (
                      <span key={t} className="px-3 py-1.5 bg-card-2 rounded-full text-[13px]">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-3 mb-1.5">이런 면도 있어요</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.personality.negative.map((t) => (
                      <span key={t} className="px-3 py-1.5 bg-white border border-line rounded-full text-[13px]">{t}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">연애 스타일</h3>
                  <p>{result.data.loveStyle}</p>
                </section>
                <section className="grid grid-cols-2 gap-2">
                  <div className="bg-card-2 rounded-[18px] p-3">
                    <p className="text-xs text-muted">잘 맞는 동물상</p>
                    <p className="font-medium mt-0.5">{result.data.compatibility.best.join(", ")}</p>
                  </div>
                  <div className="bg-card-2 rounded-[18px] p-3">
                    <p className="text-xs text-muted">맞춰 가면 좋은 동물상</p>
                    <p className="font-medium mt-0.5">{result.data.compatibility.worst.join(", ")}</p>
                  </div>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">같은 동물상 연예인</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.celebrities.map((c) => (
                      <span key={c} className="px-3 py-1.5 bg-card-2 rounded-full text-[13px]">{c}</span>
                    ))}
                  </div>
                </section>
              </div>
            </details>

            <Link href="/face2" className="mt-3 flex items-center gap-3 bg-card-2 rounded-[22px] p-4">
              <span className="w-11 h-11 rounded-full bg-paper grid place-items-center"><Icon name="face" size={24} /></span>
              <span className="flex-1">
                <span className="block font-bold">AI 관상 테스트</span>
                <span className="block text-xs text-muted mt-0.5">같은 사진으로 타고난 복과 연애운 보기</span>
              </span>
              <Icon name="chevron" size={18} className="text-muted" />
            </Link>

          </div>
        )}

        <p className="text-center text-muted text-xs mt-6 pb-4">재미로만 봐 주세요. 과학적 근거는 없어요.</p>
      </main>
    </div>
  );
}

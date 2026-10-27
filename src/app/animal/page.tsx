"use client";

import { track } from "@/lib/analytics";
import { useState, useRef } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useRememberedGender } from "@/hooks/useRememberedGender";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";
import { matchAnimal, type AnimalTypeResult } from "@/lib/animal/matcher";
import animalCalibration from "@/lib/animal/calibration.json";
import { analyzePhoto, REASON_TEXT } from "@/lib/face/analyzePhoto";
import { animalTypeDB } from "@/lib/animalTypeDB";
import ResultCard, { type ResultCardProps } from "@/components/result/ResultCard";
import ResultActions from "@/components/result/ResultActions";
import NextTests from "@/components/result/NextTests";
import { useHandedPhoto } from "@/hooks/useHandedPhoto";
import { useResultShare } from "@/hooks/useResultShare";
import { faceSlug, ogImageUrl, parseShared, shareUrl, SITE } from "@/lib/shareLinks";
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
  const [gender, setGender] = useRememberedGender(); // 다른 사진 테스트에서 고른 성별을 미리 고른다
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>();
  const { busy, notice, share: shareCard } = useResultShare(result ? { testName: 'animal', title: '운명을 읽다 · 동물상 테스트', text: parseShared('animal', result.type, result.matchScore)!.phrase, url: shareUrl('animal', result.type, result.matchScore), imageUrl: ogImageUrl('animal', result.type, result.matchScore) } : null);

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
    if (!image || !gender) return;

    setLoading(true);
    track("test_start", { test_name: "animal" });
    setError(null);
    try {
      const r = await analyzePhoto(image, gender);
      if (!r.ok) {
        setError(REASON_TEXT[r.reason]);
        return;
      }
      const matched = matchAnimal(r.z, animalCalibration.bias);
      setResult(matched);
      track("result_view", { test_name: "animal", result_id: matched.type });
    } catch (err) {
      console.error("Analysis error:", err);
      setError("사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 다른 사진 테스트에서 같은 사진으로 넘어오면 바로 분석
  useHandedPhoto(setImage, !!image && !!gender, () => void analyzeImage());

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
              onShare={shareCard}
              companion={{ label: "친구 얼굴이랑 궁합", href: `/face-match?me=${result.type}` }}
              onSave={() => { track("share_click", { test_name: "animal", method: "save_image" }); download(getShareOptions()); }}
              onRetry={resetAll}
              busy={busy || isCapturing}
              notice={notice}
            />
            {image && <NextTests current="animal" image={image} />}
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

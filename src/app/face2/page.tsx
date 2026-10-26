"use client";

import { track } from "@/lib/analytics";
import { useState, useRef, useEffect, useCallback } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import type { Gender } from "@/components/test/GenderPills";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useScreenshot } from "@/hooks/useScreenshot";
import type { AnalysisResult } from "@/lib/faceAnalyzer";
import ResultCard, { type ResultCardProps } from "@/components/result/ResultCard";
import ResultActions from "@/components/result/ResultActions";
import { useResultShare } from "@/hooks/useResultShare";
import { faceSlug, parseShared, shareUrl, SITE } from "@/lib/shareLinks";
import { Icon } from "@/components/icons";

const firstSentence = (t: string) => (t.match(/^.*?[.!?요다](?=\s|$)/)?.[0] ?? t).trim();

// 결과 카드: 분야별 운(1~5점)을 100점으로 환산해 높은 3개, 근거는 눈·입 풀이 첫 문장
function cardProps(r: AnalysisResult): ResultCardProps {
  const bars = Object.entries(r.categories)
    .map(([label, v]) => ({ label, value: Math.round(v * 20) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  return {
    eyebrow: r.type,
    title: r.title,
    summary: r.summary,
    bars,
    reasons: [
      { label: "눈", text: firstSentence(r.faceFeatures.눈) },
      { label: "입", text: firstSentence(r.faceFeatures.입) },
    ],
  };
}

export default function Face2Page() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 성별: 2b단계부터 성별별 얼굴 기준값에 쓴다
  const [gender, setGender] = useState<Gender | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>();
  const { busy, notice, share: shareCard } = useResultShare(result ? { title: '운명을 읽다 · AI 관상 테스트', text: parseShared('face', faceSlug(result.type) ?? '')?.phrase ?? `나는 ${result.type}래. 너 관상도 봐줄까?`, url: faceSlug(result.type) ? shareUrl('face', faceSlug(result.type)!) : `${SITE}/face2` } : null);

  // 모델 사전 로딩
  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        const { loadModels } = await import("@/lib/faceDetection");
        await loadModels();
        setModelsLoading(false);
        console.log("Models loaded successfully");
      } catch (err) {
        console.error("Model loading failed:", err);
        setError("모델 로딩에 실패했습니다. 페이지를 새로고침해주세요.");
        setModelsLoading(false);
      }
    };
    loadFaceModels();
  }, []);

  const getShareOptions = () => ({
    fileName: `관상분석_${result?.type || "결과"}`,
    shareTitle: `나의 관상: ${result?.type}`,
    shareText: `${result?.title} - ${result?.summary}`,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    if (!image || !gender || !imageRef.current) return;

    setLoading(true);
    track("test_start", { test_name: "face" });
    setError(null);
    let faceNotDetected = "";

    try {
      // Dynamic import로 face-api.js 로드
      const { detectFaceFeatures, FACE_NOT_DETECTED } = await import("@/lib/faceDetection");
      faceNotDetected = FACE_NOT_DETECTED;
      const { analyzeFace } = await import("@/lib/faceAnalyzer");

      // face-api.js로 얼굴 특징 감지
      const features = await detectFaceFeatures(imageRef.current);

      // 관상 분석
      const analysisResult = analyzeFace(features);
      setResult(analysisResult);
      track("result_view", { test_name: "face", result_id: analysisResult.type });
    } catch (err) {
      if (err instanceof Error && err.message === faceNotDetected) {
        setError("얼굴을 감지할 수 없습니다. 정면 얼굴 사진을 사용해주세요.");
      } else {
        console.error("Analysis error:", err);
        setError("분석 중 오류가 발생했습니다. 다른 사진으로 시도해주세요.");
      }
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
        <TestHeader title="AI 관상 테스트" onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />

        {!result && (
          <TestStart
            heading={"웃는 사진 한 장이면\n충분해요"}
            desc="눈매, 콧날, 입꼬리로 타고난 복과 연애운을 풀어드려요."
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
            preparing={modelsLoading}
            imageRef={imageRef}
          />
        )}

        {/* Result Section */}
        {result && (
          <div className="pb-6 animate-fade-in">
            <ResultCard captureRef={resultRef} {...cardProps(result)} />
            <ResultActions
              onShare={() => { track("share_click", { test_name: "face", method: "link" }); shareCard(); }}
              onSave={() => { track("share_click", { test_name: "face", method: "save_image" }); download(getShareOptions()); }}
              onRetry={resetAll}
              busy={busy || isCapturing}
              notice={notice}
            />
            <div className="mt-2">
              <CoupangBanner subId="face" />
            </div>

            <details className="group mt-4 bg-white border border-line rounded-[22px] px-5 py-4">
              <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                풀이 자세히 보기
                <Icon name="chevron" size={18} className="text-muted transition group-open:rotate-90" />
              </summary>
              <div className="mt-4 space-y-5 text-sm leading-relaxed">
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">부위별 관상</h3>
                  <dl className="space-y-2">
                    {Object.entries(result.faceFeatures).map(([부위, 설명]) => (
                      <div key={부위} className="bg-card-2 rounded-[18px] p-3">
                        <dt className="font-bold text-accent">{부위}</dt>
                        <dd className="mt-1">{설명}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">시기별 운세</h3>
                  <div className="space-y-2">
                    {Object.entries(result.lifeFortune).map(([시기, 데이터]) => (
                      <div key={시기} className="bg-card-2 rounded-[18px] p-3">
                        <p className="flex justify-between">
                          <span className="font-bold">{시기} <span className="text-xs text-muted font-normal">({데이터.period})</span></span>
                          <span className="text-accent font-medium">{데이터.rating}/5</span>
                        </p>
                        <p className="mt-1">{데이터.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">운세 지수</h3>
                  <div className="space-y-2">
                    {Object.entries(result.categories).map(([항목, 점수]) => (
                      <div key={항목} className="flex items-center gap-3">
                        <span className="w-14 flex-none">{항목}</span>
                        <div className="flex-1 bg-card rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-ink" style={{ width: `${점수 * 20}%` }} />
                        </div>
                        <span className="w-10 text-right text-accent font-medium">{점수}/5</span>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">성격 특성</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.personality.map((특성) => (
                      <span key={특성} className="px-3 py-1.5 bg-card-2 rounded-full text-[13px]">{특성}</span>
                    ))}
                  </div>
                </section>
                {result.cautions && result.cautions.length > 0 && (
                  <section>
                    <h3 className="font-serif font-bold text-base mb-2">이런 점을 살펴 보세요</h3>
                    {result.cautions.map((주의) => (
                      <p key={주의} className="mt-1">{주의}</p>
                    ))}
                  </section>
                )}
                <section>
                  <h3 className="font-serif font-bold text-base mb-2">어울리는 직업</h3>
                  <p>{result.career}</p>
                </section>
                <section className="bg-card-2 rounded-[18px] p-4">
                  <p className="text-muted text-xs">행운의 숫자 · 행운의 색</p>
                  <p className="font-bold mt-0.5">{result.luckyNumber} · {result.luckyColor}</p>
                  <p className="text-muted text-xs mt-3">관상 조언</p>
                  <p className="font-medium mt-0.5">&quot;{result.advice}&quot;</p>
                </section>
              </div>
            </details>

            <Link href="/samguk" className="mt-3 flex items-center gap-3 bg-[#E8EEE6] rounded-[22px] p-4">
              <span className="w-11 h-11 rounded-full bg-paper grid place-items-center"><Icon name="fan" size={24} /></span>
              <span className="flex-1">
                <span className="block font-bold">나는 삼국지 속 누구?</span>
                <span className="block text-xs text-muted mt-0.5">같은 사진으로 닮은 장수 찾기</span>
              </span>
              <Icon name="chevron" size={18} className="text-muted" />
            </Link>

          </div>
        )}

        <p className="text-center text-muted text-xs mt-6 pb-4">재미로만 봐 주세요. 전통 관상학을 참고했어요.</p>
      </main>
    </div>
  );
}

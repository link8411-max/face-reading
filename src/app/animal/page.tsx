"use client";

import { useState, useRef, useEffect } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import TestStart from "@/components/test/TestStart";
import type { Gender } from "@/components/test/GenderPills";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";
import type { AnimalTypeResult } from "@/lib/animalTypeAnalyzer";
import { animalTypeDB } from "@/lib/animalTypeDB";

export default function AnimalTypePage() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [result, setResult] = useState<AnimalTypeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 성별: 2b단계부터 성별별 얼굴 기준값에 쓴다
  const [gender, setGender] = useState<Gender | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

  // 모델 사전 로딩
  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        const { loadModels } = await import("@/lib/faceDetection");
        await loadModels();
        setModelsLoading(false);
      } catch (err) {
        console.error("Model loading failed:", err);
        setError("모델 로딩에 실패했습니다. 페이지를 새로고침해주세요.");
        setModelsLoading(false);
      }
    };
    loadFaceModels();
  }, []);

  const getShareOptions = () => ({
    fileName: `동물상_${result?.data.name || "결과"}`,
    shareTitle: `나의 동물상: ${result?.data.name}`,
    shareText: `${result?.data.title} - ${result?.data.charm}`,
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
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !gender || !imageRef.current) return;

    setLoading(true);
    setError(null);
    let faceNotDetected = "";

    try {
      const { detectFaceFeatures, FACE_NOT_DETECTED } = await import("@/lib/faceDetection");
      faceNotDetected = FACE_NOT_DETECTED;
      const { analyzeAnimalType } = await import("@/lib/animalTypeAnalyzer");

      const features = await detectFaceFeatures(imageRef.current);
      const analysisResult = analyzeAnimalType(features);
      setResult(analysisResult);
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
            preparing={modelsLoading}
            imageRef={imageRef}
          />
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 캡쳐 영역 시작 */}
            <div ref={resultRef} className="space-y-4 bg-[#E8D4C4] p-4 -m-4">
              {/* 기본 정보 + 사진 */}
              <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
                <div className="flex gap-4 items-start">
                  {image && (
                    <div className="flex-shrink-0">
                      <img
                        src={image}
                        alt="분석된 얼굴"
                        className="w-24 h-24 object-cover rounded-2xl border-2 border-[#FFD700]/60"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-center">
                    <span className="text-5xl block mb-2">{result.data.emoji}</span>
                    <h2 className="text-2xl font-bold mb-1 text-[#C41E3A]">{result.data.name}</h2>
                    <p className="text-[#5C4033]/70 text-sm mb-2">매칭률 {result.matchScore}%</p>
                    {result.secondaryType && (
                      <p className="text-xs text-[#5C4033]/60">
                        + {animalTypeDB[result.secondaryType].emoji} {animalTypeDB[result.secondaryType].name} 느낌도 있어요
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 동물상 설명 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-xl font-bold mb-3 text-[#C41E3A] text-center">{result.data.title}</h3>
                <p className="text-[#5C4033]/80 text-sm leading-relaxed">{result.data.description}</p>
              </div>

              {/* 얼굴 특징 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">분석된 얼굴 특징</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.features).map(([부위, 설명]) => (
                    <div key={부위} className="bg-white/50 rounded-xl p-2 border border-[#C41E3A]/20 text-center">
                      <span className="text-xs text-[#5C4033]/60">{부위}</span>
                      <p className="text-sm font-medium text-[#5C4033]">{설명}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 성격 특성 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">성격 특성</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-green-600 mb-2 font-medium">긍정적인 면</p>
                    <div className="flex flex-wrap gap-2">
                      {result.data.personality.positive.map((trait, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100/50 text-green-700 rounded-full text-sm border border-green-300/50">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-orange-600 mb-2 font-medium">주의할 점</p>
                    <div className="flex flex-wrap gap-2">
                      {result.data.personality.negative.map((trait, i) => (
                        <span key={i} className="px-3 py-1 bg-orange-100/50 text-orange-700 rounded-full text-sm border border-orange-300/50">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 매력 포인트 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">매력 포인트</h3>
                <div className="bg-[#FFD700]/15 rounded-xl p-4 border border-[#FFD700]/40">
                  <p className="text-[#5C4033] text-center font-medium">&quot;{result.data.charm}&quot;</p>
                </div>
              </div>

              {/* 연애 스타일 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-md">
                <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">연애 스타일</h3>
                <p className="text-[#5C4033]/80 text-sm leading-relaxed">{result.data.loveStyle}</p>
              </div>

              {/* 궁합 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">동물상 궁합</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-pink-50/50 rounded-xl p-3 border border-pink-300/50">
                    <p className="text-xs text-pink-600 mb-2 text-center font-medium">최고의 궁합</p>
                    <div className="flex justify-center gap-2">
                      {result.data.compatibility.best.map((animal, i) => (
                        <span key={i} className="text-xl" title={animal}>
                          {animalTypeDB[animal.replace('상', '').toLowerCase()]?.emoji || animal}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#5C4033]/60 text-center mt-1">
                      {result.data.compatibility.best.join(', ')}
                    </p>
                  </div>
                  <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-300/50">
                    <p className="text-xs text-gray-600 mb-2 text-center font-medium">주의할 궁합</p>
                    <div className="flex justify-center gap-2">
                      {result.data.compatibility.worst.map((animal, i) => (
                        <span key={i} className="text-xl opacity-60" title={animal}>
                          {animalTypeDB[animal.replace('상', '').toLowerCase()]?.emoji || animal}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#5C4033]/60 text-center mt-1">
                      {result.data.compatibility.worst.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 닮은 연예인 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">같은 동물상 연예인</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {result.data.celebrities.map((celeb, i) => (
                    <span key={i} className="px-3 py-1 bg-[#C41E3A]/10 text-[#C41E3A] rounded-full text-sm border border-[#C41E3A]/30">
                      {celeb}
                    </span>
                  ))}
                </div>
              </div>

              <CoupangBanner subId="animal" />
            </div>
            {/* 캡쳐 영역 끝 */}

            {/* 공유 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => download(getShareOptions())}
                disabled={isCapturing}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl font-bold text-center hover:shadow-lg transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "캡쳐중..." : "이미지 저장"}
              </button>
              <button
                onClick={() => share(getShareOptions())}
                disabled={isCapturing}
                className="flex-1 py-3 bg-gradient-to-r from-[#1E3A5F] to-blue-600 rounded-2xl font-bold text-center hover:shadow-lg transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "캡쳐중..." : "친구에게 공유"}
              </button>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/50 border-2 border-[#5C4033]/20 rounded-2xl font-bold hover:bg-white/80 transition text-[#5C4033]"
              >
                다시하기
              </button>
              <Link
                href="/face2"
                className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-2xl font-bold text-center hover:shadow-lg transition text-white"
              >
                관상 분석 👤
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[#5C4033]/50 text-xs mt-8">
          재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}

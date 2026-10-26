"use client";

import { useState, useRef, useEffect } from "react";
import { useBackOrHome } from "@/hooks/useBackOrHome";
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
    if (!image || !imageRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const { detectFaceFeatures } = await import("@/lib/faceDetection");
      const { analyzeAnimalType } = await import("@/lib/animalTypeAnalyzer");

      const features = await detectFaceFeatures(imageRef.current);
      const analysisResult = analyzeAnimalType(features);
      setResult(analysisResult);
    } catch (err) {
      console.error("Analysis error:", err);
      if (err instanceof Error && err.message.includes("No face detected")) {
        setError("얼굴을 감지할 수 없습니다. 정면 얼굴 사진을 사용해주세요.");
      } else {
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
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] via-[#E8D4C4] to-[#F5E6D3] text-[#5C4033] relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 bg-[#C41E3A] rounded-full" />
        <div className="absolute top-40 right-16 w-2 h-2 bg-[#1E3A5F] rounded-full" />
        <div className="absolute top-72 left-1/4 w-2.5 h-2.5 bg-[#FFD700] rounded-full" />
        <div className="absolute bottom-60 right-1/3 w-3 h-3 bg-[#C41E3A] rounded-full" />
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-[#D4AF37] rounded-full" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => result ? resetAll() : goBack()}
            className="text-[#C41E3A]/80 hover:text-[#C41E3A] transition font-medium"
          >
            ← {result ? '다시하기' : '돌아가기'}
          </button>
          <span className="text-2xl">🐾</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-2xl">🦊</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#C41E3A]" style={{ textShadow: "0 2px 8px rgba(196, 30, 58, 0.2)" }}>
            동물상 테스트
          </h1>
          <p className="text-[#5C4033]/70 text-sm tracking-widest">
            나는 어떤 동물을 닮았을까?
          </p>
          <p className="text-[#1E3A5F]/70 text-xs mt-1">
            AI가 분석하는 나의 동물상
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-[#FFD700]/80 text-xs">◆</span>
            <span className="text-[#C41E3A]/60 text-xs">━━━━━</span>
            <span className="text-[#FFD700]/80 text-xs">◆</span>
          </div>
        </div>

        {/* 모델 로딩 상태 */}
        {modelsLoading && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border-2 border-[#FFD700]/40 text-center shadow-md">
            <div className="animate-spin text-3xl mb-3">🐾</div>
            <p className="text-[#5C4033] font-medium">분석 모델 로딩 중...</p>
            <p className="text-[#5C4033]/60 text-sm mt-1">첫 방문 시 약간의 시간이 걸립니다</p>
          </div>
        )}

        {/* Upload Section */}
        {!result && !modelsLoading && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border-2 border-[#C41E3A]/30 shadow-lg">
            <div
              className="border-2 border-dashed border-[#C41E3A]/40 rounded-2xl p-8 text-center cursor-pointer hover:border-[#C41E3A]/60 hover:bg-[#F5E6D3]/50 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <img
                  ref={imageRef}
                  src={image}
                  alt="업로드된 이미지"
                  className="max-h-64 mx-auto rounded-2xl border-2 border-[#FFD700]/50"
                  crossOrigin="anonymous"
                />
              ) : (
                <div>
                  <span className="text-5xl mb-4 block">📷</span>
                  <p className="text-[#5C4033] font-medium">얼굴 사진을 업로드하세요</p>
                  <p className="text-[#5C4033]/60 text-sm mt-2">
                    정면 얼굴이 잘 보이는 사진이 좋아요
                  </p>
                  <p className="text-[#C41E3A]/60 text-[10px] mt-4">
                    ※ 사진은 서버에 저장되지 않으며 분석 후 즉시 삭제됩니다.
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {error && (
              <div className="mt-4 p-3 bg-red-100/50 border-2 border-[#C41E3A]/30 rounded-2xl text-center">
                <p className="text-[#C41E3A] text-sm font-medium">{error}</p>
              </div>
            )}

            {image && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetAll}
                  className="flex-1 py-3 bg-white/50 border-2 border-[#5C4033]/20 rounded-2xl font-bold hover:bg-white/80 transition text-[#5C4033]"
                >
                  다시 선택
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-2xl font-bold hover:shadow-lg transition disabled:opacity-50 text-white"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🐾</span> 분석 중...
                    </span>
                  ) : (
                    "동물상 찾기 🔍"
                  )}
                </button>
              </div>
            )}
          </div>
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

              {/* Coupang Partners Banner */}
              <div className="mt-2">
                <p className="text-center text-xs text-[#5C4033]/60 mb-2">추천 상품</p>
                <div className="flex justify-center">
                  <iframe
                    src="https://ads-partners.coupang.com/widgets.html?id=950676&template=carousel&trackingCode=AF6497036&subId=&width=450&height=130&tsource="
                    width="450"
                    height="130"
                    frameBorder="0"
                    scrolling="no"
                    referrerPolicy="unsafe-url"
                    className="rounded-2xl max-w-full"
                  />
                </div>
                <p className="text-center text-[#5C4033]/50 text-[10px] mt-2">
                  쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다
                </p>
              </div>
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

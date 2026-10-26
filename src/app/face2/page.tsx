"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useScreenshot } from "@/hooks/useScreenshot";
import type { AnalysisResult } from "@/lib/faceAnalyzer";

export default function Face2Page() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !imageRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Dynamic import로 face-api.js 로드
      const { detectFaceFeatures } = await import("@/lib/faceDetection");
      const { analyzeFace } = await import("@/lib/faceAnalyzer");

      // face-api.js로 얼굴 특징 감지
      const features = await detectFaceFeatures(imageRef.current);

      // 관상 분석
      const analysisResult = analyzeFace(features);
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

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    return "★".repeat(fullStars) + (hasHalf ? "☆" : "") + "☆".repeat(5 - fullStars - (hasHalf ? 1 : 0));
  };

  const 운아이콘: Record<string, string> = {
    재물운: "💰",
    애정운: "💕",
    직장운: "💼",
    건강운: "💪",
    대인운: "🤝",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] via-[#E8D4C4] to-[#F5E6D3] text-[#5C4033] relative overflow-hidden">
      {/* 민화 문양 배경 */}
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
          <span className="text-2xl">👤</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-2xl">☯</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#C41E3A]" style={{ textShadow: "0 2px 8px rgba(196, 30, 58, 0.2)" }}>
            AI 관상 테스트
          </h1>
          <p className="text-[#5C4033]/70 text-sm tracking-widest">
            전통 관상학 기반 얼굴 분석
          </p>
          <p className="text-[#1E3A5F]/70 text-xs mt-1">
            ⚡ 빠른 분석 (브라우저 내 처리)
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
            <div className="animate-spin text-3xl mb-3">☯</div>
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
                      <span className="animate-spin">☯</span> 분석 중...
                    </span>
                  ) : (
                    "관상 분석하기"
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
                  {/* 업로드한 사진 */}
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
                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] text-white rounded-full text-sm font-bold mb-2">
                      {result.type}
                    </span>
                    <h2 className="text-xl font-bold mb-2 text-[#5C4033]">{result.title}</h2>
                    <p className="text-[#5C4033]/80 text-sm leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* 얼굴 부위별 분석 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">부위별 관상</h3>
                <div className="space-y-3">
                  {Object.entries(result.faceFeatures).map(([부위, 설명]) => (
                    <div key={부위} className="bg-white/50 rounded-2xl p-3 border border-[#C41E3A]/20">
                      <span className="text-[#C41E3A] font-medium">{부위}</span>
                      <p className="text-sm text-[#5C4033]/80 mt-1">{설명}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 시기별 운세 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">시기별 운세</h3>
                <div className="space-y-4">
                  {Object.entries(result.lifeFortune).map(([시기, 데이터]) => (
                    <div
                      key={시기}
                      className={`rounded-2xl p-4 border-2 ${시기 === "초년운"
                          ? "bg-green-50/50 border-green-600/30"
                          : 시기 === "중년운"
                            ? "bg-[#FFD700]/10 border-[#FFD700]/40"
                            : "bg-[#C41E3A]/10 border-[#C41E3A]/30"
                        }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="font-bold text-[#5C4033]">
                            {시기 === "초년운" && "🌱 "}
                            {시기 === "중년운" && "🌳 "}
                            {시기 === "말년운" && "🍂 "}
                            {시기}
                          </span>
                          <span className="text-xs text-[#5C4033]/60 ml-2">
                            ({데이터.period})
                          </span>
                        </div>
                        <span className="text-[#FFD700]">
                          {renderStars(데이터.rating)}
                        </span>
                      </div>
                      <p className="text-sm text-[#5C4033]/80">{데이터.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 세부 운세 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">운세 지수</h3>
                <div className="space-y-3">
                  {Object.entries(result.categories).map(([항목, 점수]) => (
                    <div key={항목} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-[#5C4033] font-medium">
                        <span className="text-[#C41E3A]">{운아이콘[항목]}</span> {항목}
                      </span>
                      <div className="flex-1 bg-white/50 rounded-full h-3 overflow-hidden border border-[#C41E3A]/20">
                        <div
                          className="h-full bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-full transition-all duration-500"
                          style={{ width: `${점수 * 20}%` }}
                        />
                      </div>
                      <span className="text-[#FFD700] text-sm w-16 text-right">
                        {renderStars(점수)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 성격 특성 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">성격 특성</h3>
                <div className="flex flex-wrap gap-2">
                  {result.personality.map((특성, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#FFD700]/15 text-[#5C4033] rounded-full text-sm border border-[#FFD700]/40 font-medium"
                    >
                      {특성}
                    </span>
                  ))}
                </div>
              </div>

              {/* 주의사항 */}
              {result.cautions && result.cautions.length > 0 && (
                <div className="bg-orange-50/50 backdrop-blur-sm rounded-3xl p-6 border-2 border-orange-400/30 shadow-md">
                  <h3 className="text-lg font-bold mb-4 text-orange-700 flex items-center gap-2">
                    <span>주의사항</span>
                  </h3>
                  <div className="space-y-2">
                    {result.cautions.map((주의, index) => (
                      <p
                        key={index}
                        className="text-sm text-[#5C4033]/90 leading-relaxed pl-1"
                      >
                        {주의}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* 어울리는 직업 */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/30 shadow-md">
                <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">어울리는 직업</h3>
                <p className="text-[#5C4033]/90">{result.career}</p>
              </div>

              {/* 행운 요소 & 조언 */}
              <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">행운 요소</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#FFD700]/15 rounded-2xl p-3 text-center border border-[#FFD700]/40">
                    <p className="text-xs text-[#5C4033]/70">행운의 숫자</p>
                    <p className="text-2xl font-bold text-[#C41E3A]">
                      {result.luckyNumber}
                    </p>
                  </div>
                  <div className="bg-[#FFD700]/15 rounded-2xl p-3 text-center border border-[#FFD700]/40">
                    <p className="text-xs text-[#5C4033]/70">행운의 색상</p>
                    <p className="text-xl font-bold text-[#5C4033]">{result.luckyColor}</p>
                  </div>
                </div>
                <div className="bg-[#C41E3A]/10 rounded-2xl p-4 text-center border-2 border-[#C41E3A]/30">
                  <p className="text-xs text-[#5C4033]/60 mb-1">관상 조언</p>
                  <p className="text-[#C41E3A] font-medium">&quot;{result.advice}&quot;</p>
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
                {isCapturing ? "⏳ 캡쳐중..." : "📥 이미지 저장"}
              </button>
              <button
                onClick={() => share(getShareOptions())}
                disabled={isCapturing}
                className="flex-1 py-3 bg-gradient-to-r from-[#1E3A5F] to-blue-600 rounded-2xl font-bold text-center hover:shadow-lg transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📤 내 관상 친구와 비교하기"}
              </button>
            </div>

            {/* 다른 얼굴 테스트로 이어가기 */}
            <Link
              href="/samguk"
              className="block w-full py-4 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 rounded-2xl font-bold text-center hover:shadow-lg transition text-white border-2 border-purple-400/30"
            >
              <span className="text-lg">⚔️ 내 얼굴은 어떤 삼국지 영웅?</span>
              <p className="text-xs text-purple-100/80 mt-1">같은 사진으로 닮은꼴 찾기</p>
            </Link>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/50 border-2 border-[#5C4033]/20 rounded-2xl font-bold hover:bg-white/80 transition text-[#5C4033]"
              >
                다시하기
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-2xl font-bold text-center hover:shadow-lg transition text-white"
              >
                운세 보기
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[#5C4033]/50 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 전통 관상학을 참고했습니다.
        </p>
      </main>
    </div>
  );
}

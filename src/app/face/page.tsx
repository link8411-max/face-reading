"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";

interface AnalysisResult {
  type: string;
  title: string;
  faceFeatures: {
    이마: string;
    눈: string;
    코: string;
    입: string;
    전체윤곽: string;
  };
  lifeFortune: {
    초년운: { period: string; rating: number; description: string };
    중년운: { period: string; rating: number; description: string };
    말년운: { period: string; rating: number; description: string };
  };
  categories: {
    재물운: number;
    애정운: number;
    직장운: number;
    건강운: number;
    대인운: number;
  };
  personality: string[];
  career: string;
  advice: string;
  luckyNumber: number;
  luckyColor: string;
  summary: string;
}

export default function FacePage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

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
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch {
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const 운아이콘: Record<string, string> = {
    재물운: "💰",
    애정운: "💕",
    직장운: "💼",
    건강운: "💪",
    대인운: "🤝",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-red-950 to-stone-950 text-white relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-amber-400 rounded-full" />
        <div className="absolute top-40 right-16 w-1.5 h-1.5 bg-red-400 rounded-full" />
        <div className="absolute top-72 left-1/4 w-1 h-1 bg-amber-300 rounded-full" />
        <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-red-300 rounded-full" />
        <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-amber-500 rounded-full" />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-amber-700/70 hover:text-amber-600 transition">
            ← 돌아가기
          </Link>
          <span className="text-2xl">👤</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-amber-600/60">━━</span>
            <span className="text-2xl">☯</span>
            <span className="text-amber-600/60">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200" style={{ textShadow: "0 0 30px rgba(251, 191, 36, 0.3)" }}>
            AI 관상 분석
          </h1>
          <p className="text-amber-100/60 text-sm tracking-widest">
            전통 관상학 기반 얼굴 분석
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-red-800/60 text-xs">◆</span>
            <span className="text-amber-600/40 text-xs">━━━━━</span>
            <span className="text-red-800/60 text-xs">◆</span>
          </div>
        </div>

        {/* Upload Section */}
        {!result && (
          <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-amber-600/20">
            <div
              className="border-2 border-dashed border-amber-600/30 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <img
                  src={image}
                  alt="업로드된 이미지"
                  className="max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div>
                  <span className="text-5xl mb-4 block">📷</span>
                  <p className="text-amber-100/80">얼굴 사진을 업로드하세요</p>
                  <p className="text-stone-500 text-sm mt-2">
                    정면 얼굴이 잘 보이는 사진이 좋아요
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

            {image && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetAll}
                  className="flex-1 py-3 bg-stone-800/50 border border-amber-600/20 rounded-xl font-bold hover:bg-stone-700/50 transition text-amber-100/80"
                >
                  다시 선택
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-red-700 to-amber-600 rounded-xl font-bold hover:from-red-600 hover:to-amber-500 transition disabled:opacity-50 text-amber-100"
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
            <div ref={resultRef} className="space-y-4 bg-stone-900 p-4 -m-4">
            {/* 기본 정보 + 사진 */}
            <div className="bg-gradient-to-r from-red-900/40 to-amber-900/40 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <div className="flex gap-4 items-start">
                {/* 업로드한 사진 */}
                {image && (
                  <div className="flex-shrink-0">
                    <img
                      src={image}
                      alt="분석된 얼굴"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-amber-500/50"
                    />
                  </div>
                )}
                <div className="flex-1 text-center">
                  <span className="inline-block px-4 py-1 bg-gradient-to-r from-red-700 to-amber-600 text-amber-100 rounded-full text-sm font-bold mb-2">
                    {result.type}
                  </span>
                  <h2 className="text-xl font-bold mb-2 text-amber-100">{result.title}</h2>
                  <p className="text-stone-300 text-sm leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* 얼굴 부위별 분석 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">부위별 관상</h3>
              <div className="space-y-3">
                {Object.entries(result.faceFeatures).map(([부위, 설명]) => (
                  <div key={부위} className="bg-stone-900/50 rounded-xl p-3 border border-amber-600/10">
                    <span className="text-amber-400 font-medium">{부위}</span>
                    <p className="text-sm text-stone-300 mt-1">{설명}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 시기별 운세 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">시기별 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.lifeFortune).map(([시기, 데이터]) => (
                  <div
                    key={시기}
                    className={`rounded-xl p-4 border ${
                      시기 === "초년운"
                        ? "bg-emerald-900/20 border-emerald-600/20"
                        : 시기 === "중년운"
                        ? "bg-amber-900/20 border-amber-600/20"
                        : "bg-red-900/20 border-red-600/20"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-bold text-amber-100">
                          {시기 === "초년운" && "🌱 "}
                          {시기 === "중년운" && "🌳 "}
                          {시기 === "말년운" && "🍂 "}
                          {시기}
                        </span>
                        <span className="text-xs text-stone-400 ml-2">
                          ({데이터.period})
                        </span>
                      </div>
                      <span className="text-amber-400">
                        {renderStars(데이터.rating)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-300">{데이터.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 세부 운세 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">운세 지수</h3>
              <div className="space-y-3">
                {Object.entries(result.categories).map(([항목, 점수]) => (
                  <div key={항목} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-amber-100">
                      <span className="text-amber-400">{운아이콘[항목]}</span> {항목}
                    </span>
                    <div className="flex-1 bg-stone-800/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${점수 * 20}%` }}
                      />
                    </div>
                    <span className="text-amber-400 text-sm w-16 text-right">
                      {renderStars(점수)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 성격 특성 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">성격 특성</h3>
              <div className="flex flex-wrap gap-2">
                {result.personality.map((특성, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-900/30 text-amber-300/80 rounded-full text-sm border border-amber-600/20"
                  >
                    {특성}
                  </span>
                ))}
              </div>
            </div>

            {/* 어울리는 직업 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-3 text-amber-100">어울리는 직업</h3>
              <p className="text-stone-300">{result.career}</p>
            </div>

            {/* 행운 요소 & 조언 */}
            <div className="bg-gradient-to-r from-red-900/40 to-amber-900/40 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">행운 요소</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-stone-900/50 rounded-xl p-3 text-center border border-amber-600/10">
                  <p className="text-xs text-stone-400">행운의 숫자</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {result.luckyNumber}
                  </p>
                </div>
                <div className="bg-stone-900/50 rounded-xl p-3 text-center border border-amber-600/10">
                  <p className="text-xs text-stone-400">행운의 색상</p>
                  <p className="text-xl font-bold text-amber-100">{result.luckyColor}</p>
                </div>
              </div>
              <div className="bg-stone-900/50 rounded-xl p-4 text-center border border-amber-600/20">
                <p className="text-xs text-stone-500 mb-1">관상 조언</p>
                <p className="text-amber-300 font-medium">"{result.advice}"</p>
              </div>
            </div>

            {/* Coupang Partners Banner */}
            <div className="mt-2">
              <p className="text-center text-xs text-stone-500 mb-2">추천 상품</p>
              <div className="flex justify-center">
                <iframe
                  src="https://ads-partners.coupang.com/widgets.html?id=950676&template=carousel&trackingCode=AF6497036&subId=&width=450&height=130&tsource="
                  width="450"
                  height="130"
                  frameBorder="0"
                  scrolling="no"
                  referrerPolicy="unsafe-url"
                  className="rounded-lg max-w-full"
                />
              </div>
              <p className="text-center text-stone-700 text-[10px] mt-2">
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
                className="flex-1 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-xl font-bold text-center hover:from-emerald-600 hover:to-emerald-500 transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📥 이미지 저장"}
              </button>
              <button
                onClick={() => share(getShareOptions())}
                disabled={isCapturing}
                className="flex-1 py-3 bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl font-bold text-center hover:from-blue-600 hover:to-blue-500 transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📤 공유하기"}
              </button>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-stone-800/50 border border-amber-600/20 rounded-xl font-bold hover:bg-stone-700/50 transition text-amber-100/80"
              >
                다시하기
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-red-700 to-amber-600 rounded-xl font-bold text-center hover:from-red-600 hover:to-amber-500 transition text-amber-100"
              >
                운세 보기 🔮
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-stone-600 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 전통 관상학을 참고했습니다.
        </p>
      </main>
    </div>
  );
}

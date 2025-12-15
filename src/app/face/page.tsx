"use client";

import { useState, useRef } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white">
      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← 돌아가기
          </Link>
          <span className="text-2xl">👤</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            AI 관상 분석
          </h1>
          <p className="text-gray-300 text-sm">
            전통 관상학 기반 얼굴 분석
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <div
              className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-pink-400 transition"
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
                  <p className="text-gray-300">얼굴 사진을 업로드하세요</p>
                  <p className="text-gray-500 text-sm mt-2">
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
                  className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition"
                >
                  다시 선택
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔮</span> 분석 중...
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
            {/* 기본 정보 + 사진 */}
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex gap-4 items-start">
                {/* 업로드한 사진 */}
                {image && (
                  <div className="flex-shrink-0">
                    <img
                      src={image}
                      alt="분석된 얼굴"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-pink-400/50"
                    />
                  </div>
                )}
                <div className="flex-1 text-center">
                  <span className="inline-block px-4 py-1 bg-pink-500 text-white rounded-full text-sm font-bold mb-2">
                    {result.type}
                  </span>
                  <h2 className="text-xl font-bold mb-2">{result.title}</h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* 얼굴 부위별 분석 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">🔍 부위별 관상</h3>
              <div className="space-y-3">
                {Object.entries(result.faceFeatures).map(([부위, 설명]) => (
                  <div key={부위} className="bg-white/5 rounded-xl p-3">
                    <span className="text-pink-400 font-medium">{부위}</span>
                    <p className="text-sm text-gray-300 mt-1">{설명}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 시기별 운세 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📅 시기별 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.lifeFortune).map(([시기, 데이터]) => (
                  <div
                    key={시기}
                    className={`rounded-xl p-4 ${
                      시기 === "초년운"
                        ? "bg-blue-500/20"
                        : 시기 === "중년운"
                        ? "bg-yellow-500/20"
                        : "bg-green-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-bold">
                          {시기 === "초년운" && "🌱 "}
                          {시기 === "중년운" && "🌳 "}
                          {시기 === "말년운" && "🍂 "}
                          {시기}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({데이터.period})
                        </span>
                      </div>
                      <span className="text-yellow-400">
                        {renderStars(데이터.rating)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{데이터.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 세부 운세 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📊 운세 지수</h3>
              <div className="space-y-3">
                {Object.entries(result.categories).map(([항목, 점수]) => (
                  <div key={항목} className="flex items-center gap-3">
                    <span className="w-20 text-sm">
                      {운아이콘[항목]} {항목}
                    </span>
                    <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${점수 * 20}%` }}
                      />
                    </div>
                    <span className="text-yellow-400 text-sm w-16 text-right">
                      {renderStars(점수)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 성격 특성 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">✨ 성격 특성</h3>
              <div className="flex flex-wrap gap-2">
                {result.personality.map((특성, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm"
                  >
                    {특성}
                  </span>
                ))}
              </div>
            </div>

            {/* 어울리는 직업 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3">💼 어울리는 직업</h3>
              <p className="text-gray-300">{result.career}</p>
            </div>

            {/* 행운 요소 & 조언 */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">🍀 행운의 요소</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">행운의 숫자</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {result.luckyNumber}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">행운의 색상</p>
                  <p className="text-xl font-bold">{result.luckyColor}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">관상학적 조언</p>
                <p className="text-yellow-300 font-medium">"{result.advice}"</p>
              </div>
            </div>

            {/* Coupang Partners Banner */}
            <div className="mt-2">
              <p className="text-center text-xs text-gray-400 mb-2">추천 상품</p>
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
              <p className="text-center text-gray-600 text-[10px] mt-2">
                쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받습니다
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition"
              >
                다시하기 🔄
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-center hover:opacity-90 transition"
              >
                운세 보기 🔮
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 전통 관상학을 참고했습니다.
        </p>
      </main>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";

// 하루 1회 제한 체크 함수
const AI_LIMIT_KEY = "face_ai_last_used";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function checkDailyLimit(): { canUse: boolean; remainingTime: string } {
  if (typeof window === "undefined") return { canUse: true, remainingTime: "" };

  const lastUsed = localStorage.getItem(AI_LIMIT_KEY);
  if (!lastUsed) return { canUse: true, remainingTime: "" };

  const lastTime = parseInt(lastUsed, 10);
  const now = Date.now();
  const diff = now - lastTime;

  if (diff >= ONE_DAY_MS) {
    return { canUse: true, remainingTime: "" };
  }

  const remaining = ONE_DAY_MS - diff;
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  return {
    canUse: false,
    remainingTime: `${hours}시간 ${minutes}분 후 이용 가능`
  };
}

function setDailyLimit() {
  if (typeof window !== "undefined") {
    localStorage.setItem(AI_LIMIT_KEY, Date.now().toString());
  }
}

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
  cautions?: string[];
  luckyNumber: number;
  luckyColor: string;
  summary: string;
}

export default function FacePage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dailyLimit, setDailyLimitState] = useState<{ canUse: boolean; remainingTime: string }>({ canUse: true, remainingTime: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

  // 페이지 로드 시 하루 1회 제한 체크 - 이미 사용했으면 face2로 이동
  useEffect(() => {
    const limit = checkDailyLimit();
    if (!limit.canUse) {
      router.replace("/face2");
      return;
    }
    setDailyLimitState(limit);
  }, [router]);

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

    // 하루 1회 제한 체크
    const limitCheck = checkDailyLimit();
    if (!limitCheck.canUse) {
      alert(`오늘은 이미 AI 분석을 이용하셨습니다.\n${limitCheck.remainingTime}`);
      return;
    }

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
        // 성공 시 사용 시간 기록
        setDailyLimit();
        setDailyLimitState({ canUse: false, remainingTime: "23시간 59분 후 이용 가능" });
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
            onClick={() => result ? resetAll() : router.back()}
            className="text-[#C41E3A]/70 hover:text-[#C41E3A] transition"
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
            AI 관상 분석
          </h1>
          <p className="text-[#5C4033]/60 text-sm tracking-widest">
            전통 관상학 기반 얼굴 분석
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-[#FFD700]/80 text-xs">◆</span>
            <span className="text-[#C41E3A]/60 text-xs">━━━━━</span>
            <span className="text-[#FFD700]/80 text-xs">◆</span>
          </div>
        </div>

        {/* 하루 1회 제한 안내 */}
        {!dailyLimit.canUse && !result && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-6 border-2 border-[#1E3A5F]/30 text-center">
            <p className="text-[#1E3A5F] font-medium">🔮 오늘의 AI 분석을 이미 사용하셨습니다</p>
            <p className="text-[#5C4033]/70 text-sm mt-1">{dailyLimit.remainingTime}</p>
            <Link
              href="/face2"
              className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] hover:opacity-90 rounded-lg text-sm font-medium transition text-white"
            >
              무료 관상 분석 이용하기 →
            </Link>
          </div>
        )}

        {/* Upload Section */}
        {!result && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border-2 border-[#C41E3A]/30 shadow-lg">
            <div
              className="border-2 border-dashed border-[#C41E3A]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[#C41E3A]/50 transition"
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
                  <p className="text-[#5C4033]">얼굴 사진을 업로드하세요</p>
                  <p className="text-[#5C4033]/60 text-sm mt-2">
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
                  className="flex-1 py-3 bg-white/80 border-2 border-[#C41E3A]/30 rounded-xl font-bold hover:bg-white transition text-[#5C4033]"
                >
                  다시 선택
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 text-white"
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
            <div ref={resultRef} className="space-y-4 bg-[#F5E6D3] p-4 -m-4">
            {/* 기본 정보 + 사진 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <div className="flex gap-4 items-start">
                {/* 업로드한 사진 */}
                {image && (
                  <div className="flex-shrink-0">
                    <img
                      src={image}
                      alt="분석된 얼굴"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-[#C41E3A]/50"
                    />
                  </div>
                )}
                <div className="flex-1 text-center">
                  <span className="inline-block px-4 py-1 bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] text-white rounded-full text-sm font-bold mb-2">
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
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/40 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">부위별 관상</h3>
              <div className="space-y-3">
                {Object.entries(result.faceFeatures).map(([부위, 설명]) => (
                  <div key={부위} className="bg-white/70 rounded-xl p-3 border border-[#C41E3A]/20">
                    <span className="text-[#C41E3A] font-medium">{부위}</span>
                    <p className="text-sm text-[#5C4033]/80 mt-1">{설명}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 시기별 운세 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#1E3A5F]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">시기별 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.lifeFortune).map(([시기, 데이터]) => (
                  <div
                    key={시기}
                    className={`rounded-xl p-4 border-2 ${
                      시기 === "초년운"
                        ? "bg-green-50/80 border-green-600/30"
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
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/40 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">운세 지수</h3>
              <div className="space-y-3">
                {Object.entries(result.categories).map(([항목, 점수]) => (
                  <div key={항목} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-[#5C4033]">
                      <span>{운아이콘[항목]}</span> {항목}
                    </span>
                    <div className="flex-1 bg-white/80 rounded-full h-3 overflow-hidden border border-[#C41E3A]/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] rounded-full transition-all duration-500"
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
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#1E3A5F]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">성격 특성</h3>
              <div className="flex flex-wrap gap-2">
                {result.personality.map((특성, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#FFD700]/15 text-[#5C4033] rounded-full text-sm border border-[#FFD700]/40"
                  >
                    {특성}
                  </span>
                ))}
              </div>
            </div>

            {/* 어울리는 직업 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">어울리는 직업</h3>
              <p className="text-[#5C4033]">{result.career}</p>
            </div>

            {/* 행운 요소 & 조언 */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/40 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">행운 요소</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/80 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60">행운의 숫자</p>
                  <p className="text-2xl font-bold text-[#C41E3A]">
                    {result.luckyNumber}
                  </p>
                </div>
                <div className="bg-white/80 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60">행운의 색상</p>
                  <p className="text-xl font-bold text-[#5C4033]">{result.luckyColor}</p>
                </div>
              </div>
              <div className="bg-white/80 rounded-xl p-4 text-center border border-[#C41E3A]/30">
                <p className="text-xs text-[#5C4033]/60 mb-1">관상 조언</p>
                <p className="text-[#C41E3A] font-medium">"{result.advice}"</p>
              </div>
            </div>

            {/* 주의사항 */}
            {result.cautions && result.cautions.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-orange-500/40 shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-orange-600">⚠️ 주의사항</h3>
                <div className="space-y-2">
                  {result.cautions.map((주의, index) => (
                    <div key={index} className="bg-orange-50/80 rounded-xl p-3 border border-orange-400/30">
                      <p className="text-sm text-[#5C4033] leading-relaxed">{주의}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  className="rounded-lg max-w-full"
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
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 rounded-xl font-bold text-center hover:opacity-90 transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📥 이미지 저장"}
              </button>
              <button
                onClick={() => share(getShareOptions())}
                disabled={isCapturing}
                className="flex-1 py-3 bg-gradient-to-r from-[#1E3A5F] to-[#1E3A5F]/80 rounded-xl font-bold text-center hover:opacity-90 transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📤 내 관상 친구와 비교하기"}
              </button>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/80 border-2 border-[#C41E3A]/30 rounded-xl font-bold hover:bg-white transition text-[#5C4033]"
              >
                다시하기
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] rounded-xl font-bold text-center hover:opacity-90 transition text-white"
              >
                운세 보기 🔮
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

"use client";

import { useState, useRef, useEffect } from "react";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import Link from "next/link";
import { SamgukCharacter } from "@/lib/samgukDB";
import { useScreenshot } from "@/hooks/useScreenshot";
import { extractFeatures, checkFrontal } from "@/lib/face/landmarkFeatures";
import { toZ } from "@/lib/face/featureStats";
import { matchCharacter, type Gender } from "@/lib/samguk/matcher";
import calibration from "@/lib/samguk/calibration.json";
import { compressImage } from "@/lib/compressImage";

interface AnalysisResult {
  name: string;
  matchReason: string;
  similarity: number;
  faceAnalysis: {
    눈: string;
    코: string;
    입: string;
    얼굴형: string;
    인상: string;
  };
  character: SamgukCharacter;
}

// 코에이 스타일 수평 스탯 바
function KoeiStatLine({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-16 text-amber-200 text-[14.5px] font-black drop-shadow-sm italic tracking-tighter">{label}</div>
      <div className="flex-1 relative h-5 bg-black/50 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-stone-800">
        <div
          className="absolute inset-y-0.5 left-0.5 bg-gradient-to-r from-red-700 to-red-500 rounded-sm transition-all duration-1000 shadow-[0_0_10px_rgba(185,28,28,0.6)]"
          style={{ width: `calc(${Math.min(value, max)}% - 4px)` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)]"></div>
        </div>
      </div>
      <div className="w-10 text-right text-white font-mono text-[14.5px] font-black italic">{value}</div>
    </div>
  );
}

// 코에이 스타일 장식 프레임
function KoeiFrame({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <div className={`relative p-4 ${className}`}>
      {/* 바깥쪽 갈색 나무 테두리 */}
      <div className="absolute inset-0 border-[6px] border-[#8B4513] rounded-lg shadow-2xl"></div>
      {/* 안쪽 오렌지색 무늬 테두리 (Koei 특유의 꼬임 무늬) */}
      <div className="absolute inset-1 border-[3px] border-[#CD853F] rounded-md opacity-80" style={{ backgroundImage: 'radial-gradient(circle, #CD853F 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
      <div className="absolute -inset-1 border border-[#63300C] rounded-xl pointer-events-none opacity-50"></div>

      {/* 메인 배경 (돌 질감) */}
      <div className="relative bg-[#203a36] min-h-[100px] border-2 border-black/40 rounded shadow-inner p-3 sm:p-4">
        {/* 돌 질감 오버레이 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-leather.png")' }}></div>

        {title && (
          <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#C41E3A] px-4 py-1 border-2 border-[#D4AF37] rounded shadow-[0_2px_4px_black] z-30 whitespace-nowrap">
            <span className="text-white text-[10px] sm:text-xs font-bold tracking-widest">{title}</span>
          </div>
        )}
        {children}
      </div>

      {/* 모서리 못 장식 */}
      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-600 border border-black/50 shadow-sm"></div>
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600 border border-black/50 shadow-sm"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-amber-600 border border-black/50 shadow-sm"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-amber-600 border border-black/50 shadow-sm"></div>
    </div>
  );
}

// 코에이 스타일 인셋 박스
function KoeiInsetBox({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/20 border border-stone-900 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] p-3 rounded-sm ${className}`}>
      {children}
    </div>
  );
}

// 하단 버튼 그룹
function KoeiButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div role="tablist" aria-label="장수 정보" className="flex gap-1.5 p-1 bg-[#203a36] rounded border border-black/50">
      {children}
    </div>
  );
}

function KoeiButton({ label, onClick, highlight = false }: { label: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <button
      role="tab"
      aria-selected={highlight}
      onClick={onClick}
      className={`flex-1 py-2 px-2 text-xs font-bold border-2 rounded shadow-sm hover:brightness-110 active:scale-95 transition-all
        ${highlight
          ? "bg-[#C41E3A] border-[#D4AF37] text-white"
          : "bg-stone-700 border-stone-500 text-amber-100 shadow-[inset_0_1px_4px_rgba(255,255,255,0.2)]"}`}
    >
      {label}
    </button>
  );
}

export default function SamgukPage() {
  const goBack = useBackOrHome();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("열전");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

  const loadingMessages = [
    "장수들의 명부를 훑어보는 중...",
    "관상에서 영웅의 기개를 찾는 중...",
    "눈매의 기운을 측정하여 지략을 읽는 중...",
    "전장의 용맹함이 누구와 닮았는지 대조 중...",
    "천하를 호령할 기운이 느껴집니다...",
    "거의 다 되었습니다. 영웅의 탄생을 기다리세요..."
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [loading, loadingMessages.length]);

  const getShareOptions = () => ({
    fileName: `삼국지닮은꼴_${result?.character.name || "결과"}`,
    shareTitle: `나의 삼국지 닮은꼴: ${result?.character.name}`,
    shareText: `나는 ${result?.character.name}(${result?.character.hanja})와 ${result?.similarity}% 닮았대요! 🎭`,
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
    if (!image || !gender) return;

    setLoading(true);
    try {
      // 이미지 축소 후 브라우저 안에서 얼굴 랜드마크 추출 (사진은 서버로 보내지 않음)
      const compressedImage = await compressImage(image);
      const img = new Image();
      img.src = compressedImage;
      await img.decode();

      let landmarks;
      try {
        const { detectLandmarks } = await import("@/lib/face/mediapipe");
        landmarks = await detectLandmarks(img);
      } catch {
        alert("분석 도구를 불러오지 못했어요. 새로고침해 주세요.");
        return;
      }
      if (!landmarks) {
        alert("얼굴을 찾지 못했어요. 얼굴이 잘 보이는 사진을 올려 주세요.");
        return;
      }
      if (!checkFrontal(landmarks).ok) {
        alert("정면 사진을 올려 주세요. 고개를 돌린 사진은 닮은꼴을 찾기 어려워요.");
        return;
      }

      const features = extractFeatures(landmarks);
      if (process.env.NODE_ENV !== "production") console.info("[samguk] features", features);
      setResult(matchCharacter(toZ(features), gender, calibration.bias));
      // 결과가 나오면 페이지 상단으로 스크롤하여 결과를 바로 볼 수 있게 함
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      alert("사진을 읽지 못했어요. JPG나 PNG 사진으로 다시 올려 주세요.");
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

  const getFactionBgClass = (faction: string) => {
    switch (faction) {
      case "위": return "from-blue-900/80 to-blue-950/90";
      case "촉": return "from-green-900/80 to-green-950/90";
      case "오": return "from-red-900/80 to-red-950/90";
      default: return "from-purple-900/80 to-purple-950/90";
    }
  };

  const getFactionBorderClass = (faction: string) => {
    switch (faction) {
      case "위": return "border-blue-500/50";
      case "촉": return "border-green-500/50";
      case "오": return "border-red-500/50";
      default: return "border-purple-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] via-[#E8D4C4] to-[#F5E6D3] text-[#5C4033] relative">
      {/* 민화 배경 - 고서/두루마리 느낌 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl text-[#1E3A5F]">魏</div>
        <div className="absolute top-20 right-20 text-6xl text-green-700">蜀</div>
        <div className="absolute bottom-40 left-20 text-6xl text-[#C41E3A]">吳</div>
        <div className="absolute bottom-20 right-10 text-4xl text-[#D4AF37]">三國志</div>
        <div className="absolute top-1/2 left-1/3 text-3xl text-[#FFD700]/60">天下</div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => result ? resetAll() : goBack()}
            className="text-[#C41E3A]/70 hover:text-[#C41E3A] transition"
          >
            ← {result ? '다시하기' : '돌아가기'}
          </button>
          <span className="text-2xl">⚔️</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-2xl">🏯</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#C41E3A]" style={{ textShadow: "0 2px 8px rgba(196, 30, 58, 0.2)" }}>
            삼국지 닮은꼴
          </h1>
          <p className="text-[#5C4033]/60 text-sm tracking-widest">
            나는 어떤 삼국지 인물일까?
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-[#FFD700]/80 text-xs">◆</span>
            <span className="text-[#C41E3A]/60 text-xs">━━━━━</span>
            <span className="text-[#FFD700]/80 text-xs">◆</span>
          </div>
        </div>

        {/* Upload Section (Koei Style) */}
        {!result && !loading && (
          <div className="animate-fade-in no-screenshot">
            <KoeiFrame title="장수 탐색">
              <div className="flex flex-col items-center">
                <div
                  className="w-full aspect-square max-w-[280px] bg-black/40 border-2 border-dashed border-stone-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors group relative overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-grid-animate opacity-5 pointer-events-none"></div>
                  {image ? (
                    <img
                      src={image}
                      alt="업로드된 이미지"
                      className="w-full h-full object-cover rounded opacity-80"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-4">
                      <div className="text-6xl group-hover:scale-110 transition-transform duration-500 opacity-60">📸</div>
                      <div className="space-y-1">
                        <p className="text-amber-200 font-bold text-lg tracking-widest drop-shadow-md uppercase">인상 심사 (印象 審査)</p>
                        <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em]">
                          초상화를 올려 영웅의 기개를 측정하세요
                        </p>
                      </div>
                      <div className="mt-4 inline-block px-3 py-1 bg-amber-900/30 border border-amber-600/30 rounded text-[10px] text-amber-500/80 animate-pulse">
                        WANTED: 천하의 영웅
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full mt-6 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-amber-100/60 uppercase tracking-widest">기개 측정 지침</p>
                  </div>
                  <KoeiInsetBox className="text-[11px] text-stone-300/80 leading-relaxed font-medium">
                    <p>※ 정면 사진은 인식의 기개가 더욱 높습니다.</p>
                    <p>※ 안면의 랜드마크를 통해 52인의 장수와 대조합니다.</p>
                    <p className="text-amber-500/80 mt-1">※ 사진은 서버로 전송되지 않고 브라우저 안에서만 분석됩니다.</p>
                  </KoeiInsetBox>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="w-full mt-6">
                  <p className="text-[11px] font-bold text-amber-100/70 mb-2 px-1">어느 장수들과 겨룰까요?</p>
                  <div className="flex gap-3">
                    {(["남", "여"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2 rounded border text-xs font-bold transition ${gender === g ? "bg-amber-700 border-amber-400 text-white" : "bg-stone-800/50 border-stone-600 text-amber-200/70"}`}
                      >
                        {g === "남" ? "남성 인물" : "여성 인물"}
                      </button>
                    ))}
                  </div>
                </div>

                {image && (
                  <div className="w-full flex gap-3 mt-6">
                    <button
                      onClick={resetAll}
                      className="flex-1 py-3 bg-stone-700/50 border border-stone-500 rounded text-amber-200 text-xs font-bold hover:bg-stone-700 transition"
                    >
                      초기화
                    </button>
                    <button
                      onClick={analyzeImage}
                      disabled={loading || !gender}
                      className="flex-1 py-3 bg-gradient-to-r from-red-800 to-red-600 border border-red-500 rounded text-white text-xs font-bold hover:brightness-110 transition shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-40"
                    >
                      {gender ? "영웅 탐색 시작 ⚔️" : "인물 성별을 먼저 골라 주세요"}
                    </button>
                  </div>
                )}
              </div>
            </KoeiFrame>
          </div>
        )}

        {/* Loading Overlay (Same as before but with minor fixes) */}
        {loading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500">
            <div className="max-w-xs w-full px-6 flex flex-col items-center">
              <div className="relative w-48 h-48 mb-8">
                <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border border-amber-400/50 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 overflow-hidden rounded-full border-2 border-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {image ? (
                    <img src={image} alt="Scanning" className="w-full h-full object-cover opacity-50 contrast-125 grayscale" />
                  ) : (
                    <div className="w-full h-full bg-amber-950/50 flex items-center justify-center text-4xl">👤</div>
                  )}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_10px_#fbbf24] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
                <div className="absolute inset-0 border-t-2 border-b-2 border-amber-400/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-0 border-l-2 border-r-2 border-amber-400/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              </div>

              <div className="text-center space-y-4 w-full">
                <div className="inline-block px-4 py-1 bg-amber-900/50 border border-amber-500/50 rounded-full text-xs text-amber-300 font-bold tracking-widest animate-bounce">
                  SYSTEM: 영웅 탐색 중...
                </div>
                <h2 className="text-xl font-bold text-white tracking-widest drop-shadow-lg min-h-[1.75em]">
                  {loadingMessages[loadingStep]}
                </h2>
                <div className="bg-stone-900/80 border border-amber-900/50 rounded-lg p-3 h-28 overflow-hidden text-left font-mono text-[10px] text-amber-400/80 relative">
                  <div className="space-y-1 transition-all duration-500" style={{ transform: `translateY(-${Math.max(0, (loadingStep - 2) * 16)}px)` }}>
                    <p className="flex items-center gap-2 italic text-emerald-500">&gt; DATABASE CONNECTION: ESTABLISHED</p>
                    <p className="flex items-center gap-2"><span className="text-amber-600">●</span><span>&gt; 분석 알고리즘 초기화... [OK]</span></p>
                    {loadingStep >= 1 && <p className="flex items-center gap-2 items-in text-emerald-400"><span className="text-emerald-500">●</span><span>&gt; 안면 특징점 데이터 수집 완료.</span></p>}
                    {loadingStep >= 2 && <p className="flex items-center gap-2"><span className="text-amber-600">●</span><span>&gt; 영웅 52인 페르소나 대조 시작...</span></p>}
                    {loadingStep >= 3 && <p className="flex items-center gap-2"><span className="text-amber-600">●</span><span>&gt; 기개(氣槪) 레벨 측정 중... 89.4%</span></p>}
                    {loadingStep >= 4 && <p className="flex items-center gap-2 text-blue-300 font-black animate-pulse"><span className="text-blue-500">●</span><span>&gt; MATCHING CHARACTER ID: FOUND</span></p>}
                    {loadingStep >= 5 && <p className="flex items-center gap-2 text-white"><span className="text-white animate-ping text-[4px]">●</span><span>&gt; 영웅의 자태를 렌더링합니다...</span></p>}
                  </div>
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]"></div>
                </div>
                <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 transition-all duration-500 ease-out" style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes scan { 0%, 100% { top: 0%; opacity: 0; } 5% { opacity: 1; } 95% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #5C4033; border-radius: 2px; }
        `}</style>

        {/* Result Section */}
        {result && (
          <div className="animate-fade-in relative z-10 px-2 sm:px-0">
            <div ref={resultRef} className="bg-[#1a120b] p-2 sm:p-4 -mx-4 sm:mx-0 shadow-2xl rounded-sm">
              <KoeiFrame title="장수정보">
                <div className="space-y-6">
                  {/* 상단: 이미지와 기본 정보 박스 */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* 장수 포트레이트 */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative p-1 bg-gradient-to-br from-stone-800 to-black border-2 border-[#8B4513] shadow-[0_0_15px_black] rounded-sm shrink-0">
                        <img
                          src={`/images/samguk/${result.character.name}.jpg`}
                          alt={result.character.name}
                          className="w-28 h-36 sm:w-36 sm:h-48 object-cover border border-black"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${result.character.name}&background=random`;
                          }}
                        />
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-900 border border-amber-600 rounded text-[9px] text-white font-bold">
                          SR
                        </div>
                        <div className="absolute bottom-1 left-0 right-0 py-1 bg-gradient-to-t from-black to-stone-900/90 text-center border-t border-stone-800">
                          <span className="text-amber-200 text-xs font-bold leading-none">{result.character.name}</span>
                        </div>
                      </div>
                      <div className="w-full grid grid-cols-2 gap-1 text-[9px] font-bold">
                        <div className="bg-stone-800 border border-stone-600 px-2 py-0.5 text-amber-200 text-center rounded-sm truncate">{result.character.role}</div>
                        <div className={`border px-2 py-0.5 text-white text-center rounded-sm ${result.character.faction === "위" ? "bg-blue-900 border-blue-600" :
                          result.character.faction === "촉" ? "bg-green-900 border-green-600" :
                            result.character.faction === "오" ? "bg-red-900 border-red-600" : "bg-purple-900 border-purple-600"
                          }`}>세력: {result.character.faction}</div>
                      </div>
                    </div>

                    {/* 기본 신상 정보 박스 */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between mb-2 border-b-2 border-black/60 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xl font-black drop-shadow-lg leading-tight">{result.character.name}</span>
                          <span className="text-amber-300/50 text-[13px] font-medium">{result.character.hanja}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded border border-white/5">
                          <span className="text-amber-500 font-black text-[11px] uppercase tracking-widest italic">Match:</span>
                          <span className="text-white font-mono text-base font-black italic">{result.similarity}%</span>
                        </div>
                      </div>

                      <KoeiInsetBox className="p-4 space-y-4 bg-black/40">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-amber-300/60 font-black text-[11px] uppercase tracking-wider">영웅의 추천 현대 직무</span>
                          <span className="text-white font-bold text-[16px] leading-snug break-keep">{result.character.modernJob}</span>
                        </div>
                        <div className="border-t border-stone-800/80 pt-3">
                          <span className="text-amber-300/60 font-black text-[11px] uppercase tracking-wider block mb-2">영웅 대변 특성</span>
                          <div className="flex flex-wrap gap-2">
                            {result.character.traits.map((t, i) => (
                              <span key={i} className="bg-amber-900/50 text-amber-100 text-[11.5px] px-2.5 py-1 rounded border border-amber-500/20 font-bold shadow-sm">{t}</span>
                            ))}
                          </div>
                        </div>
                      </KoeiInsetBox>

                      <div className="space-y-2">
                        <div className="text-[13px] text-amber-500 ml-1 font-black italic tracking-widest">◈ 닮은 점</div>
                        <KoeiInsetBox className="text-[13px] text-amber-100 leading-relaxed font-bold bg-black/60 p-4">
                          <p className="leading-relaxed text-[13px] drop-shadow-sm">{result.matchReason}</p>
                        </KoeiInsetBox>
                      </div>
                    </div>
                  </div>

                  {/* 탭: 내용 바로 위, 스크롤해도 화면 위에 붙어 있음 */}
                  <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-[#203a36]/95 backdrop-blur-sm no-screenshot">
                    <KoeiButtonGroup>
                      {(["열전", "능력", "현대", "특기"] as const).map((tab) => (
                        <KoeiButton key={tab} label={tab} highlight={selectedTab === tab} onClick={() => {
                          setSelectedTab(tab);
                          // 탭 바만 보이고 내용이 화면 밖이면 내용 시작 위치로 이동
                          requestAnimationFrame(() => document.getElementById("samguk-tabpanel")?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
                        }} />
                      ))}
                    </KoeiButtonGroup>
                  </div>

                  {/* 탭 콘텐츠 영역 */}
                  <div id="samguk-tabpanel" role="tabpanel" aria-label={selectedTab} className="min-h-[320px] scroll-mt-16">
                    {selectedTab === "열전" && (
                      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="text-stone-400 text-[13px] font-black italic tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-stone-600 rotate-45 shadow-[0_0_8px_rgba(0,0,0,1)]"></span>
                          HEROIC LEGEND & COMMENTARY
                        </div>
                        <div className="bg-black/50 border border-stone-800 p-5 rounded-sm space-y-5 shadow-2xl">
                          <div className="relative pl-8 py-3 border-l-4 border-amber-900/30">
                            <span className="absolute left-1 top-0 text-4xl text-amber-800 font-serif">&ldquo;</span>
                            <p className="text-amber-200 text-lg sm:text-xl italic leading-relaxed font-black drop-shadow-md">&quot;{result.character.quote}&quot;</p>
                            <span className="absolute right-2 bottom-0 text-4xl text-amber-800 font-serif rotate-180">&ldquo;</span>
                          </div>
                          <p className="text-stone-100 text-[15px] sm:text-[17px] leading-loose pt-5 border-t border-stone-800 font-bold tracking-tight">
                            {result.character.description}
                          </p>
                          <div className="bg-gradient-to-br from-stone-800 to-stone-900 p-4 rounded-md border border-stone-700 shadow-inner">
                            <p className="text-amber-600 text-[13px] font-black mb-2 tracking-widest uppercase italic">[현대적 재구성] - {result.character.modernJob}</p>
                            <p className="text-amber-100 text-[14px] sm:text-[15.5px] font-bold leading-relaxed">{result.character.modernComment}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTab === "능력" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="text-emerald-400 text-[10px] font-black flex items-center gap-2 tracking-widest italic">
                          <span className="w-2 h-0.5 bg-emerald-500"></span>
                          CLASSIC ABILITIES
                        </div>
                        <div className="bg-black/30 p-6 rounded border border-stone-800 space-y-3">
                          <KoeiStatLine label="통솔" value={result.character.stats.통솔} />
                          <KoeiStatLine label="무력" value={result.character.stats.무력} />
                          <KoeiStatLine label="지력" value={result.character.stats.지력} />
                          <KoeiStatLine label="정치" value={result.character.stats.정치} />
                          <KoeiStatLine label="매력" value={result.character.stats.매력} />
                          <div className="mt-6 pt-4 border-t border-stone-800/50">
                            <p className="text-[10px] text-stone-500 italic">※ 코에이 삼국지 시리즈의 능력치 밸런스를 기준으로 산출되었습니다.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTab === "현대" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="text-blue-400 text-[10px] font-black flex items-center gap-2 tracking-widest italic">
                          <span className="w-2 h-0.5 bg-blue-500"></span>
                          MODERN SOCIAL STATS
                        </div>
                        <div className="bg-black/30 p-6 rounded border border-stone-800 space-y-3">
                          <KoeiStatLine label="리더십" value={result.character.modernStats.리더십} />
                          <KoeiStatLine label="체력" value={result.character.modernStats.체력} />
                          <KoeiStatLine label="두뇌" value={result.character.modernStats.두뇌} />
                          <KoeiStatLine label="처세술" value={result.character.modernStats.눈치} />
                          <KoeiStatLine label="연애력" value={result.character.modernStats.연애력} />
                          <div className="mt-4 p-3 bg-blue-900/10 border border-blue-900/30 rounded">
                            <p className="text-blue-300 text-[10px] font-bold">권장 현대 직무</p>
                            <p className="text-white text-xs mt-1">{result.character.modernJob}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTab === "특기" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="text-purple-400 text-[10px] font-black flex items-center gap-2 tracking-widest italic">
                          <span className="w-2 h-0.5 bg-purple-500"></span>
                          SPECIAL TRAITS & LIFESTYLE
                        </div>
                        <div className="space-y-4">
                          <KoeiInsetBox className="flex flex-wrap gap-2">
                            {result.character.traits.map((t, i) => (
                              <span key={i} className="bg-purple-900/40 text-purple-200 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                                # {t}
                              </span>
                            ))}
                          </KoeiInsetBox>

                          <div className="bg-black/20 p-4 rounded border border-stone-800">
                            <p className="text-amber-400/60 text-[8px] font-bold mb-4 uppercase tracking-[0.3em] text-center">생활 능력치</p>
                            <div className="grid grid-cols-5 gap-2">
                              {Object.entries(result.character.funStats).map(([label, val]) => (
                                <div key={label} className="text-center">
                                  <p className="text-[9px] text-stone-500 mb-2 h-8 flex items-center justify-center leading-tight">{label}</p>
                                  <div className="relative w-1.5 h-16 bg-stone-800 rounded-full overflow-hidden mx-auto">
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-700 to-purple-400" style={{ height: `${val}%` }}></div>
                                  </div>
                                  <p className="text-[10px] text-purple-300 mt-2 font-mono font-bold">{val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* 하단 버튼 인터페이스 */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-black/40">
                    <div className="flex justify-between items-center px-1 pt-2">
                      <div className="text-[10px] text-stone-400 font-serif tracking-tighter italic">천하의 기운이 영웅의 자태에 머무나니...</div>
                      <div className="flex gap-1 opacity-50">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        <div className="w-1 h-1 rounded-full bg-red-500"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                      </div>
                    </div>
                  </div>

                </div>
              </KoeiFrame>

              {/* 공유 및 제어 버튼 */}
              <div className="grid grid-cols-2 gap-3 mt-4 no-screenshot px-1 sm:px-0">
                <button
                  onClick={() => download(getShareOptions())}
                  disabled={isCapturing}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-b from-[#8B4513] to-[#5C4033] text-white rounded shadow-[0_4px_0_#3d1e08] hover:translate-y-[2px] hover:shadow-[0_2px_0_#3d1e08] active:translate-y-[4px] active:shadow-none transition-all text-sm font-bold border border-[#CD853F] disabled:opacity-50"
                >
                  <span className="text-lg">💾</span> {isCapturing ? "기록중..." : "결과 저장"}
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-b from-stone-700 to-stone-800 text-stone-200 rounded shadow-[0_4px_0_#1c1c1c] hover:translate-y-[2px] hover:shadow-[0_2px_0_#1c1c1c] active:translate-y-[4px] active:shadow-none transition-all text-sm font-bold border border-stone-500"
                >
                  <span className="text-lg">🔄</span> 다시 하기
                </button>
              </div>

              {/* 쿠팡 파트너스 배너 */}
              <div className="mt-6 no-screenshot">
                <div className="p-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-between gap-3 shadow-inner">
                  <div className="text-[9.5px] text-stone-400 leading-tight">
                    이 포스팅은 쿠팡 파트너스 활동의 일환으로, <br />이에 따른 일정액의 수수료를 제공받습니다.
                  </div>
                  <Link
                    href="https://link.coupang.com/a/dfIih6"
                    target="_blank"
                    className="flex-shrink-0 bg-[#C41E3A] text-white text-[9px] font-bold px-3 py-1.5 rounded shadow-[0_2px_0_black] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <span className="opacity-70 mr-1">[AD]</span> 영웅의 장비 쇼핑
                  </Link>
                </div>
              </div>
            </div>

            {/* 하단 모바일 공유 */}
            <div className="mt-6 px-2 no-screenshot text-center pb-12">
              <p className="text-[11px] text-stone-500 italic mb-3 tracking-tighter">※ 저장 버튼이 작동하지 않으면 이미지를 길게 터치하여 저장하세요.</p>
              <button
                onClick={() => share(getShareOptions())}
                className="w-full py-3 bg-emerald-900/60 border border-emerald-800 text-emerald-200 text-[12px] font-bold rounded shadow-sm hover:bg-emerald-800 transition-colors"
              >
                카카오톡으로 나의 기개 뽐내기 ⚔️
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 text-center pb-10">
          <div className="w-12 h-0.5 bg-stone-700 mx-auto mb-4 opacity-30"></div>
          <p className="text-stone-500 text-[10px] font-serif italic">
            &copy; 2026 운명을 읽다 · 삼국지 닮은꼴
          </p>
        </div>
      </main>
    </div>
  );
}

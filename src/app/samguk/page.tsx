"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { SamgukCharacter } from "@/lib/samgukDB";
import { useScreenshot } from "@/hooks/useScreenshot";

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

// 오각형 레이더 차트 컴포넌트
function RadarChart({ stats }: { stats: { 통솔: number; 무력: number; 지력: number; 정치: number; 매력: number } }) {
  const size = 200;
  const center = size / 2;
  const radius = 70;

  const statKeys = ["통솔", "무력", "지력", "정치", "매력"] as const;
  const angles = statKeys.map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);

  // 배경 오각형 (격자)
  const createPentagon = (r: number) => {
    return angles.map((angle, i) => {
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };

  // 스탯 오각형
  const statPoints = angles.map((angle, i) => {
    const value = stats[statKeys[i]] / 100;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // 레이블 위치
  const labelPositions = angles.map((angle) => ({
    x: center + (radius + 25) * Math.cos(angle),
    y: center + (radius + 25) * Math.sin(angle),
  }));

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* 배경 격자 */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => (
        <path
          key={i}
          d={createPentagon(radius * scale)}
          fill="none"
          stroke="rgba(217, 119, 6, 0.2)"
          strokeWidth="1"
        />
      ))}

      {/* 중심에서 꼭짓점으로 선 */}
      {angles.map((angle, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(angle)}
          y2={center + radius * Math.sin(angle)}
          stroke="rgba(217, 119, 6, 0.2)"
          strokeWidth="1"
        />
      ))}

      {/* 스탯 영역 */}
      <polygon
        points={statPoints}
        fill="rgba(234, 179, 8, 0.3)"
        stroke="rgb(234, 179, 8)"
        strokeWidth="2"
      />

      {/* 꼭짓점 포인트 */}
      {angles.map((angle, i) => {
        const value = stats[statKeys[i]] / 100;
        const x = center + radius * value * Math.cos(angle);
        const y = center + radius * value * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="rgb(234, 179, 8)"
          />
        );
      })}

      {/* 레이블 */}
      {statKeys.map((stat, i) => (
        <text
          key={stat}
          x={labelPositions[i].x}
          y={labelPositions[i].y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-amber-200 text-xs font-bold"
        >
          {stat}
        </text>
      ))}

      {/* 수치 */}
      {statKeys.map((stat, i) => {
        const value = stats[stat] / 100;
        const x = center + (radius * value + 12) * Math.cos(angles[i]);
        const y = center + (radius * value + 12) * Math.sin(angles[i]);
        return (
          <text
            key={`val-${stat}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-[10px] font-bold ${stats[stat] >= 90 ? 'fill-yellow-400' : 'fill-amber-400'}`}
          >
            {stats[stat]}
          </text>
        );
      })}
    </svg>
  );
}

// 코에이 스타일 수평 스탯 바 컴포넌트
function KoeiStatBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  // 스탯에 따른 색상 결정
  const getBarColor = (val: number) => {
    if (val >= 90) return "from-yellow-400 via-amber-500 to-yellow-600";
    if (val >= 75) return "from-amber-500 via-orange-500 to-amber-600";
    if (val >= 60) return "from-orange-600 via-amber-700 to-orange-700";
    return "from-amber-700 via-stone-600 to-amber-800";
  };

  const getGlowColor = (val: number) => {
    if (val >= 90) return "shadow-yellow-500/50";
    if (val >= 75) return "shadow-amber-500/40";
    return "shadow-amber-700/30";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 text-right">
        <span className="text-amber-200 text-sm font-bold">{icon}</span>
      </div>
      <div className="flex-1">
        <div className="relative h-5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded border border-amber-900/50 overflow-hidden shadow-inner">
          {/* 배경 격자 패턴 */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(251, 191, 36, 0.3) 10px, rgba(251, 191, 36, 0.3) 11px)'
          }}></div>

          {/* 스탯 바 */}
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getBarColor(value)} transition-all duration-500 ${getGlowColor(value)} shadow-md`}
            style={{ width: `${value}%` }}
          >
            {/* 하이라이트 효과 */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20"></div>
            {/* 애니메이션 광택 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>

          {/* 수치 표시 */}
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <span className={`text-xs font-bold drop-shadow-md ${
              value >= 50 ? 'text-white' : 'text-amber-200'
            }`}>
              {value}
            </span>
          </div>
        </div>
      </div>
      <div className="w-10 text-left">
        <span className="text-amber-300/70 text-xs">{label}</span>
      </div>
    </div>
  );
}

export default function SamgukPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

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
    if (!image) return;

    setLoading(true);
    try {
      const response = await fetch("/api/samguk", {
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
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/30 to-stone-950 text-white relative overflow-hidden">
      {/* 배경 - 고서/두루마리 느낌 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl text-amber-200">魏</div>
        <div className="absolute top-20 right-20 text-6xl text-green-200">蜀</div>
        <div className="absolute bottom-40 left-20 text-6xl text-red-200">吳</div>
        <div className="absolute bottom-20 right-10 text-4xl text-amber-200">三國志</div>
        <div className="absolute top-1/2 left-1/3 text-3xl text-amber-200/50">天下</div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-amber-700/70 hover:text-amber-600 transition">
            ← 돌아가기
          </Link>
          <span className="text-2xl">⚔️</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-amber-600/60">━━</span>
            <span className="text-2xl">🏯</span>
            <span className="text-amber-600/60">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200" style={{ textShadow: "0 0 30px rgba(251, 191, 36, 0.3)" }}>
            삼국지 닮은꼴
          </h1>
          <p className="text-amber-100/60 text-sm tracking-widest">
            나는 어떤 삼국지 인물일까?
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-red-800/60 text-xs">◆</span>
            <span className="text-amber-600/40 text-xs">━━━━━</span>
            <span className="text-red-800/60 text-xs">◆</span>
          </div>
        </div>

        {/* Upload Section */}
        {!result && (
          <div className="bg-gradient-to-b from-stone-900/80 to-amber-950/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-amber-600/30 shadow-lg shadow-amber-900/20">
            <div
              className="border-2 border-dashed border-amber-600/40 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/60 transition bg-stone-900/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <img
                  src={image}
                  alt="업로드된 이미지"
                  className="max-h-64 mx-auto rounded-lg border-2 border-amber-500/30"
                />
              ) : (
                <div>
                  <span className="text-5xl mb-4 block">📸</span>
                  <p className="text-amber-100/80">얼굴 사진을 업로드하세요</p>
                  <p className="text-stone-500 text-sm mt-2">
                    당신과 닮은 삼국지 영웅을 찾아드립니다
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
                  className="flex-1 py-3 bg-stone-800/50 border border-amber-600/30 rounded-xl font-bold hover:bg-stone-700/50 transition text-amber-100/80"
                >
                  다시 선택
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-700 to-yellow-600 rounded-xl font-bold hover:from-amber-600 hover:to-yellow-500 transition disabled:opacity-50 text-stone-900"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚔️</span> 분석 중...
                    </span>
                  ) : (
                    "닮은꼴 찾기 ⚔️"
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
            {/* 메인 결과 카드 - 코에이 스타일 */}
            <div className="relative">
              {/* 외곽 금테 프레임 */}
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 via-yellow-600 to-amber-800 rounded-2xl opacity-75 blur-sm"></div>

              <div className={`relative bg-gradient-to-b ${getFactionBgClass(result.character.faction)} backdrop-blur-lg rounded-2xl border-4 border-double shadow-2xl overflow-hidden`}
                style={{
                  borderImage: 'linear-gradient(135deg, #fbbf24, #92400e, #fbbf24) 1',
                  boxShadow: '0 0 30px rgba(251, 191, 36, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.5)'
                }}>
                {/* 상단 세력 배너 - 코에이 스타일 */}
                <div className={`py-3 text-center relative ${
                  result.character.faction === "위" ? "bg-gradient-to-r from-blue-950 via-blue-800 to-blue-950" :
                  result.character.faction === "촉" ? "bg-gradient-to-r from-green-950 via-green-800 to-green-950" :
                  result.character.faction === "오" ? "bg-gradient-to-r from-red-950 via-red-800 to-red-950" :
                  "bg-gradient-to-r from-purple-950 via-purple-800 to-purple-950"
                } border-b-2 border-amber-600/50`}>
                  {/* 장식 무늬 */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/30 text-xl">◆</div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/30 text-xl">◆</div>

                  <span className="text-white font-bold tracking-[0.3em] text-lg drop-shadow-lg" style={{
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                  }}>
                    {result.character.faction === "위" ? "━ 魏 ━" :
                     result.character.faction === "촉" ? "━ 蜀 ━" :
                     result.character.faction === "오" ? "━ 吳 ━" :
                     "━ 群雄 ━"}
                  </span>
                </div>

                {/* 나무 질감 배경 오버레이 */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(139, 69, 19, 0.3) 1px, transparent 2px, transparent 10px)',
                  mixBlendMode: 'overlay'
                }}></div>

                <div className="p-4 sm:p-6 relative z-10">
                  {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    {/* 사진 비교 영역 */}
                    <div className="flex items-center gap-2 sm:gap-4">
                      {/* 업로드한 사진 - 정사각형 프레임 */}
                      {image && (
                        <div className="flex-shrink-0">
                          <div className="relative">
                            {/* 금테 장식 프레임 */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 via-yellow-600 to-amber-700 rounded opacity-60"></div>
                            <div className="relative bg-gradient-to-br from-amber-900 to-amber-950 p-1 rounded">
                              <img
                                src={image}
                                alt="내 얼굴"
                                className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded border-2 border-amber-500/70"
                                style={{ boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)' }}
                              />
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 px-2 sm:px-3 py-1 rounded-full text-xs text-amber-100 border-2 border-amber-500/50 font-bold shadow-lg">
                              나
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 화살표 장식 */}
                      <div className="flex items-center justify-center">
                        <div className="text-xl sm:text-2xl text-amber-400" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}>→</div>
                      </div>

                      {/* 인물 초상화 영역 - 정사각형 프레임 (코에이 스타일) */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          {/* 금테 장식 프레임 */}
                          <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 via-amber-600 to-yellow-700 rounded opacity-80"></div>
                          <div className={`relative p-1 rounded ${
                            result.character.faction === "위" ? "bg-gradient-to-br from-blue-800 to-blue-950" :
                            result.character.faction === "촉" ? "bg-gradient-to-br from-green-800 to-green-950" :
                            result.character.faction === "오" ? "bg-gradient-to-br from-red-800 to-red-950" :
                            "bg-gradient-to-br from-purple-800 to-purple-950"
                          }`}>
                            <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded border-2 flex items-center justify-center text-4xl sm:text-5xl ${
                              result.character.faction === "위" ? "bg-gradient-to-br from-blue-900/80 to-blue-950/90 border-blue-400/70" :
                              result.character.faction === "촉" ? "bg-gradient-to-br from-green-900/80 to-green-950/90 border-green-400/70" :
                              result.character.faction === "오" ? "bg-gradient-to-br from-red-900/80 to-red-950/90 border-red-400/70" :
                              "bg-gradient-to-br from-purple-900/80 to-purple-950/90 border-purple-400/70"
                            }`} style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)' }}>
                              {/* 세력별 대표 이모지 */}
                              <span style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.8)' }}>
                                {result.character.stats.무력 >= 90 ? "⚔️" :
                                 result.character.stats.지력 >= 90 ? "📜" :
                                 result.character.stats.매력 >= 90 ? "👑" :
                                 result.character.stats.통솔 >= 90 ? "🏴" : "🎭"}
                              </span>
                            </div>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 px-2 sm:px-3 py-1 rounded-full text-xs text-amber-100 border-2 border-amber-500/50 font-bold shadow-lg whitespace-nowrap">
                            {result.character.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 인물 정보 */}
                    <div className="flex-1 text-center sm:text-left pt-4 sm:pt-2">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
                          result.character.faction === "위" ? "bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100" :
                          result.character.faction === "촉" ? "bg-gradient-to-r from-green-600 to-green-700 text-green-100" :
                          result.character.faction === "오" ? "bg-gradient-to-r from-red-600 to-red-700 text-red-100" :
                          "bg-gradient-to-r from-purple-600 to-purple-700 text-purple-100"
                        } border border-amber-400/30`}>
                          일치도 {result.similarity}%
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-1" style={{
                        textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                      }}>
                        {result.character.name}
                      </h2>
                      <p className="text-sm text-amber-300/80 mb-1">{result.character.hanja}</p>
                      <p className="text-xs text-amber-200/70 bg-amber-950/30 px-2 py-1 rounded inline-block border border-amber-700/30">
                        {result.character.role}
                      </p>
                    </div>
                  </div>

                  {/* 닮은 이유 - 두루마리 스타일 */}
                  <div className="mt-6 relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 rounded-xl blur"></div>
                    <div className="relative p-4 bg-gradient-to-br from-stone-900/90 to-amber-950/80 rounded-xl border-2 border-amber-600/40 shadow-inner">
                      {/* 두루마리 장식 */}
                      <div className="absolute top-2 left-2 text-amber-600/20 text-xs">◈</div>
                      <div className="absolute top-2 right-2 text-amber-600/20 text-xs">◈</div>
                      <div className="absolute bottom-2 left-2 text-amber-600/20 text-xs">◈</div>
                      <div className="absolute bottom-2 right-2 text-amber-600/20 text-xs">◈</div>

                      <p className="text-xs text-amber-400 mb-2 font-bold tracking-wider">📜 관상 분석</p>
                      <p className="text-sm text-stone-200 leading-relaxed relative z-10">
                        {result.matchReason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 능력치 - 코에이 스타일 */}
            <div className="relative">
              {/* 외곽 금테 프레임 */}
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-500 via-yellow-700 to-amber-900 rounded-2xl opacity-60 blur-sm"></div>

              <div className="relative bg-gradient-to-b from-stone-900/95 to-amber-950/80 backdrop-blur-lg rounded-2xl p-6 border-4 border-double shadow-2xl overflow-hidden"
                style={{
                  borderImage: 'linear-gradient(135deg, #f59e0b, #78350f, #f59e0b) 1',
                  boxShadow: '0 0 25px rgba(217, 119, 6, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.6)'
                }}>
                {/* 두루마리 배경 효과 */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-2 left-2 text-4xl text-amber-200">武</div>
                  <div className="absolute top-2 right-2 text-4xl text-amber-200">智</div>
                  <div className="absolute bottom-2 left-2 text-4xl text-amber-200">德</div>
                  <div className="absolute bottom-2 right-2 text-4xl text-amber-200">統</div>
                </div>

                {/* 나무 질감 */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(139, 69, 19, 0.4) 1px, transparent 2px, transparent 8px)',
                  mixBlendMode: 'overlay'
                }}></div>

                <h3 className="text-xl font-bold mb-4 text-center relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300"
                  style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}>
                  ⚔️ 능력치 ⚔️
                </h3>

                {/* 오각형 레이더 차트 */}
                <div className="relative z-10 mb-4">
                  <RadarChart stats={result.character.stats} />
                </div>

                {/* 구분선 */}
                <div className="relative z-10 flex items-center justify-center my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
                  <span className="px-3 text-amber-500/60 text-xs">━━</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
                </div>

                {/* 코에이 스타일 수평 스탯 바 */}
                <div className="relative z-10 space-y-2 bg-black/20 p-4 rounded-xl border border-amber-800/30">
                  <KoeiStatBar label="통솔" value={result.character.stats.통솔} icon="🏴" />
                  <KoeiStatBar label="무력" value={result.character.stats.무력} icon="⚔️" />
                  <KoeiStatBar label="지력" value={result.character.stats.지력} icon="📜" />
                  <KoeiStatBar label="정치" value={result.character.stats.정치} icon="👑" />
                  <KoeiStatBar label="매력" value={result.character.stats.매력} icon="✨" />
                </div>

                {/* 총합 */}
                <div className="text-center mt-4 relative z-10">
                  <div className="inline-block bg-gradient-to-r from-amber-900/50 via-amber-800/60 to-amber-900/50 px-6 py-2 rounded-full border-2 border-amber-600/50 shadow-lg">
                    <span className="text-amber-300/80 text-sm mr-2">총 능력치:</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400"
                      style={{ textShadow: '0 0 15px rgba(251, 191, 36, 0.5)' }}>
                      {Object.values(result.character.stats).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 현대판 능력치 - 코에이 스타일 */}
            {result.character.modernStats && result.character.funStats && result.character.modernComment && (
              <div className="relative">
                {/* 외곽 금테 프레임 */}
                <div className="absolute -inset-1 bg-gradient-to-br from-amber-500 via-yellow-700 to-amber-900 rounded-2xl opacity-60 blur-sm"></div>

                <div className="relative bg-gradient-to-b from-stone-900/95 to-amber-950/80 backdrop-blur-lg rounded-2xl p-6 border-4 border-double shadow-2xl overflow-hidden"
                  style={{
                    borderImage: 'linear-gradient(135deg, #f59e0b, #78350f, #f59e0b) 1',
                    boxShadow: '0 0 25px rgba(217, 119, 6, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.6)'
                  }}>
                  {/* 배경 장식 */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-2 left-2 text-3xl text-amber-200">💼</div>
                    <div className="absolute top-2 right-2 text-3xl text-amber-200">🎯</div>
                    <div className="absolute bottom-2 left-2 text-3xl text-amber-200">💰</div>
                    <div className="absolute bottom-2 right-2 text-3xl text-amber-200">🔥</div>
                  </div>

                  {/* 나무 질감 */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(139, 69, 19, 0.4) 1px, transparent 2px, transparent 8px)',
                    mixBlendMode: 'overlay'
                  }}></div>

                  <h3 className="text-xl font-bold mb-4 text-center relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300"
                    style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}>
                    💼 현대판 능력치 💼
                  </h3>

                  {/* 현대 능력치 오각형 */}
                  <div className="relative z-10 mb-4">
                    <RadarChart stats={{
                      통솔: result.character.modernStats.리더십,
                      무력: result.character.modernStats.체력,
                      지력: result.character.modernStats.두뇌,
                      정치: result.character.modernStats.눈치,
                      매력: result.character.modernStats.연애력
                    }} />
                  </div>

                  {/* 구분선 */}
                  <div className="relative z-10 flex items-center justify-center my-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
                    <span className="px-3 text-amber-500/60 text-xs">━━</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"></div>
                  </div>

                  {/* 현대 스탯 바 */}
                  <div className="relative z-10 space-y-2 bg-black/20 p-4 rounded-xl border border-amber-800/30">
                    <KoeiStatBar label="리더십" value={result.character.modernStats.리더십} icon="🏢" />
                    <KoeiStatBar label="체력" value={result.character.modernStats.체력} icon="💪" />
                    <KoeiStatBar label="두뇌" value={result.character.modernStats.두뇌} icon="🧠" />
                    <KoeiStatBar label="눈치" value={result.character.modernStats.눈치} icon="👀" />
                    <KoeiStatBar label="연애력" value={result.character.modernStats.연애력} icon="💕" />
                  </div>

                  {/* Fun Stats 섹션 */}
                  <div className="relative z-10 mt-6">
                    <div className="text-center mb-3">
                      <span className="text-amber-300/80 text-sm font-bold tracking-wider">직장인 생존 스탯</span>
                    </div>
                    <div className="space-y-2 bg-black/30 p-4 rounded-xl border border-amber-700/30">
                      <KoeiStatBar label="술자리생존" value={result.character.funStats.술자리생존} icon="🍺" />
                      <KoeiStatBar label="재테크" value={result.character.funStats.재테크} icon="💰" />
                      <KoeiStatBar label="칼퇴력" value={result.character.funStats.칼퇴력} icon="🏃" />
                      <KoeiStatBar label="꼰대력" value={result.character.funStats.꼰대력} icon="😰" />
                      <KoeiStatBar label="워라밸" value={result.character.funStats.워라밸} icon="🔥" />
                    </div>
                  </div>

                  {/* 현대 해석 말풍선 */}
                  <div className="relative z-10 mt-6">
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/30 via-yellow-600/40 to-amber-600/30 rounded-xl blur"></div>
                      <div className="relative bg-gradient-to-br from-stone-950 via-amber-950/50 to-stone-950 rounded-xl p-5 border-2 border-amber-500/50 shadow-inner">
                        {/* 말풍선 꼬리 */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-950 border-l-2 border-t-2 border-amber-500/50 rotate-45"></div>

                        {/* 장식 문양 */}
                        <div className="absolute top-1 left-2 text-amber-600/20 text-lg">💬</div>
                        <div className="absolute top-1 right-2 text-amber-600/20 text-lg">💬</div>

                        <p className="text-base text-center text-amber-100 font-medium leading-relaxed relative z-10" style={{
                          textShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
                        }}>
                          {result.character.modernComment}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 인물 설명 - 코에이 스타일 */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/30 via-yellow-700/40 to-amber-900/30 rounded-2xl opacity-60 blur"></div>
              <div className="relative bg-gradient-to-b from-stone-900/90 to-amber-950/70 backdrop-blur-lg rounded-2xl p-6 border-2 border-amber-600/40 shadow-xl"
                style={{ boxShadow: '0 0 20px rgba(217, 119, 6, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.5)' }}>
                <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 flex items-center gap-2">
                  <span>📜</span> 인물 소개
                </h3>
                <p className="text-stone-200 text-sm leading-relaxed mb-4">
                  {result.character.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.character.traits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-amber-900/50 to-amber-950/60 text-amber-200 rounded-full text-xs border-2 border-amber-600/40 shadow-md"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 성격 & 명대사 - 코에이 스타일 */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/30 via-yellow-700/40 to-amber-900/30 rounded-2xl opacity-60 blur"></div>
              <div className="relative bg-gradient-to-b from-stone-900/90 to-amber-950/70 backdrop-blur-lg rounded-2xl p-6 border-2 border-amber-600/40 shadow-xl"
                style={{ boxShadow: '0 0 20px rgba(217, 119, 6, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.5)' }}>
                <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 flex items-center gap-2">
                  <span>💬</span> 명대사
                </h3>
                {/* 두루마리 스타일 명대사 박스 */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/30 via-yellow-600/40 to-amber-600/30 rounded-xl blur"></div>
                  <div className="relative bg-gradient-to-br from-stone-950 via-amber-950/50 to-stone-950 rounded-xl p-5 border-2 border-amber-500/50 shadow-inner">
                    {/* 장식 문양 */}
                    <div className="absolute top-1 left-2 text-amber-600/20 text-lg">❖</div>
                    <div className="absolute top-1 right-2 text-amber-600/20 text-lg">❖</div>
                    <div className="absolute bottom-1 left-2 text-amber-600/20 text-lg">❖</div>
                    <div className="absolute bottom-1 right-2 text-amber-600/20 text-lg">❖</div>

                    <p className="text-lg text-center text-amber-100 italic font-medium leading-relaxed relative z-10" style={{
                      textShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
                    }}>
                      "{result.character.quote}"
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-amber-700/30">
                  <p className="text-xs text-amber-400/80 mb-2 font-bold tracking-wider">성격</p>
                  <p className="text-sm text-stone-200 leading-relaxed">{result.character.personality}</p>
                </div>
              </div>
            </div>

            {/* 현대 직업 & 내 얼굴 분석 - 코에이 스타일 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 via-yellow-700/30 to-amber-900/20 rounded-xl opacity-60 blur"></div>
                <div className="relative bg-gradient-to-b from-stone-900/85 to-amber-950/60 backdrop-blur-lg rounded-xl p-4 border-2 border-amber-600/40 shadow-lg"
                  style={{ boxShadow: '0 0 15px rgba(217, 119, 6, 0.15), inset 0 0 10px rgba(0, 0, 0, 0.5)' }}>
                  <p className="text-xs text-amber-400/70 mb-2 font-bold">현대에 태어났다면?</p>
                  <p className="text-sm text-amber-100 font-medium">{result.character.modernJob}</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 via-yellow-700/30 to-amber-900/20 rounded-xl opacity-60 blur"></div>
                <div className="relative bg-gradient-to-b from-stone-900/85 to-amber-950/60 backdrop-blur-lg rounded-xl p-4 border-2 border-amber-600/40 shadow-lg"
                  style={{ boxShadow: '0 0 15px rgba(217, 119, 6, 0.15), inset 0 0 10px rgba(0, 0, 0, 0.5)' }}>
                  <p className="text-xs text-amber-400/70 mb-2 font-bold">전체 인상</p>
                  <p className="text-sm text-amber-100">{result.faceAnalysis.인상}</p>
                </div>
              </div>
            </div>

            {/* Coupang Partners Banner 1 */}
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

            {/* 내 얼굴 분석 상세 - 코에이 스타일 */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/30 via-yellow-700/40 to-amber-900/30 rounded-2xl opacity-60 blur"></div>
              <div className="relative bg-gradient-to-b from-stone-900/90 to-amber-950/70 backdrop-blur-lg rounded-2xl p-6 border-2 border-amber-600/40 shadow-xl"
                style={{ boxShadow: '0 0 20px rgba(217, 119, 6, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.5)' }}>
                <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 flex items-center gap-2">
                  <span>🔍</span> 얼굴 분석
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.faceAnalysis).filter(([key]) => key !== "인상").map(([part, desc]) => (
                    <div key={part} className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-600/20 via-yellow-700/25 to-amber-800/20 rounded-lg opacity-60 blur-sm"></div>
                      <div className="relative bg-gradient-to-br from-stone-950/90 to-amber-950/60 rounded-lg p-3 border border-amber-600/40 shadow-md"
                        style={{ boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.5)' }}>
                        <p className="text-xs text-amber-300 mb-1 font-bold">{part}</p>
                        <p className="text-sm text-stone-200 leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                {isCapturing ? "⏳ 캡쳐중..." : "📤 친구랑 닮은꼴 비교하기"}
              </button>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-stone-800/50 border border-amber-600/30 rounded-xl font-bold hover:bg-stone-700/50 transition text-amber-100/80"
              >
                다시하기
              </button>
              <Link
                href="/"
                className="flex-1 py-3 bg-gradient-to-r from-amber-700 to-yellow-600 rounded-xl font-bold text-center hover:from-amber-600 hover:to-yellow-500 transition text-stone-900"
              >
                다른 운세 보기
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-stone-600 text-xs mt-8">
          ⚔️ 재미로만 봐주세요! AI가 추측한 결과입니다.
        </p>
      </main>
    </div>
  );
}

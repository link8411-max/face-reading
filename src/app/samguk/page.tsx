"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { SamgukCharacter } from "@/lib/samgukDB";

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

export default function SamgukPage() {
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
            {/* 메인 결과 카드 - 코에이 스타일 */}
            <div className={`bg-gradient-to-b ${getFactionBgClass(result.character.faction)} backdrop-blur-lg rounded-2xl border-2 ${getFactionBorderClass(result.character.faction)} shadow-xl overflow-hidden`}>
              {/* 상단 세력 배너 */}
              <div className={`py-2 text-center ${
                result.character.faction === "위" ? "bg-blue-800" :
                result.character.faction === "촉" ? "bg-green-800" :
                result.character.faction === "오" ? "bg-red-800" :
                "bg-purple-800"
              }`}>
                <span className="text-white font-bold tracking-widest">
                  {result.character.faction === "위" ? "━ 魏 ━" :
                   result.character.faction === "촉" ? "━ 蜀 ━" :
                   result.character.faction === "오" ? "━ 吳 ━" :
                   "━ 群雄 ━"}
                </span>
              </div>

              <div className="p-6">
                <div className="flex gap-4 items-center">
                  {/* 업로드한 사진 */}
                  {image && (
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img
                          src={image}
                          alt="내 얼굴"
                          className="w-24 h-24 object-cover rounded-lg border-2 border-amber-500/50"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-900 px-2 py-0.5 rounded text-xs text-amber-300 border border-amber-600/30">
                          나
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 화살표 */}
                  <div className="text-2xl text-amber-500">→</div>

                  {/* 인물 초상화 영역 */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-lg border-2 flex items-center justify-center text-4xl ${
                        result.character.faction === "위" ? "bg-blue-900/50 border-blue-500/50" :
                        result.character.faction === "촉" ? "bg-green-900/50 border-green-500/50" :
                        result.character.faction === "오" ? "bg-red-900/50 border-red-500/50" :
                        "bg-purple-900/50 border-purple-500/50"
                      }`}>
                        {/* 세력별 대표 이모지 */}
                        {result.character.stats.무력 >= 90 ? "⚔️" :
                         result.character.stats.지력 >= 90 ? "📜" :
                         result.character.stats.매력 >= 90 ? "👑" :
                         result.character.stats.통솔 >= 90 ? "🏴" : "🎭"}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-stone-900 px-2 py-0.5 rounded text-xs text-amber-300 border border-amber-600/30 whitespace-nowrap">
                        {result.character.name}
                      </div>
                    </div>
                  </div>

                  {/* 인물 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        result.character.faction === "위" ? "bg-blue-600 text-blue-100" :
                        result.character.faction === "촉" ? "bg-green-600 text-green-100" :
                        result.character.faction === "오" ? "bg-red-600 text-red-100" :
                        "bg-purple-600 text-purple-100"
                      }`}>
                        {result.similarity}%
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-amber-100">
                      {result.character.name}
                    </h2>
                    <p className="text-sm text-stone-400">{result.character.hanja}</p>
                    <p className="text-xs text-amber-200/80 mt-1">{result.character.role}</p>
                  </div>
                </div>

                {/* 닮은 이유 */}
                <div className="mt-4 p-4 bg-stone-900/70 rounded-xl border border-amber-600/30">
                  <p className="text-xs text-amber-400 mb-1">📜 분석 결과</p>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {result.matchReason}
                  </p>
                </div>
              </div>
            </div>

            {/* 능력치 (코에이 스타일 오각형) */}
            <div className="bg-gradient-to-b from-stone-900/90 to-amber-950/60 backdrop-blur-lg rounded-2xl p-6 border-2 border-amber-700/50 relative overflow-hidden">
              {/* 두루마리 배경 효과 */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-2 left-2 text-4xl text-amber-200">武</div>
                <div className="absolute top-2 right-2 text-4xl text-amber-200">智</div>
                <div className="absolute bottom-2 left-2 text-4xl text-amber-200">德</div>
                <div className="absolute bottom-2 right-2 text-4xl text-amber-200">統</div>
              </div>

              <h3 className="text-lg font-bold mb-2 text-amber-100 text-center relative z-10">
                ⚔️ 능력치 ⚔️
              </h3>

              {/* 오각형 레이더 차트 */}
              <div className="relative z-10">
                <RadarChart stats={result.character.stats} />
              </div>

              {/* 총합 */}
              <div className="text-center mt-2 relative z-10">
                <span className="text-stone-400 text-sm">총합: </span>
                <span className="text-xl font-bold text-yellow-400">
                  {Object.values(result.character.stats).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>

            {/* 인물 설명 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-amber-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/30">
              <h3 className="text-lg font-bold mb-3 text-amber-100 flex items-center gap-2">
                <span>📜</span> 인물 소개
              </h3>
              <p className="text-stone-300 text-sm leading-relaxed mb-4">
                {result.character.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.character.traits.map((trait, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-900/30 text-amber-300/80 rounded-full text-xs border border-amber-600/20"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* 성격 & 명대사 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-amber-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/30">
              <h3 className="text-lg font-bold mb-3 text-amber-100 flex items-center gap-2">
                <span>💬</span> 명대사
              </h3>
              <div className="bg-stone-900/50 rounded-xl p-4 border border-amber-600/20">
                <p className="text-lg text-center text-amber-200 italic">
                  "{result.character.quote}"
                </p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-stone-500 mb-2">성격</p>
                <p className="text-sm text-stone-300">{result.character.personality}</p>
              </div>
            </div>

            {/* 현대 직업 & 내 얼굴 분석 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-b from-stone-900/80 to-amber-950/50 backdrop-blur-lg rounded-2xl p-4 border border-amber-600/30">
                <p className="text-xs text-stone-500 mb-2">현대에 태어났다면?</p>
                <p className="text-sm text-amber-200 font-medium">{result.character.modernJob}</p>
              </div>
              <div className="bg-gradient-to-b from-stone-900/80 to-amber-950/50 backdrop-blur-lg rounded-2xl p-4 border border-amber-600/30">
                <p className="text-xs text-stone-500 mb-2">전체 인상</p>
                <p className="text-sm text-amber-200">{result.faceAnalysis.인상}</p>
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

            {/* 내 얼굴 분석 상세 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-amber-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/30">
              <h3 className="text-lg font-bold mb-3 text-amber-100 flex items-center gap-2">
                <span>🔍</span> 얼굴 분석
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.faceAnalysis).filter(([key]) => key !== "인상").map(([part, desc]) => (
                  <div key={part} className="bg-stone-900/50 rounded-lg p-3 border border-amber-600/10">
                    <p className="text-xs text-amber-400 mb-1">{part}</p>
                    <p className="text-sm text-stone-300">{desc}</p>
                  </div>
                ))}
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

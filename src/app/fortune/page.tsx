"use client";

import { useState } from "react";
import Link from "next/link";

interface FortuneResult {
  사주정보: {
    띠: string;
    띠이모지: string;
    사주: { 년주: string; 월주: string; 일주: string };
    일간: string;
    일간오행: string;
    음양: string;
    오행분포: Record<string, number>;
    강한오행: string;
    약한오행: string;
  };
  운세: {
    총운: { rating: number; keyword: string; summary: string };
    월별운세: { 상반기: string; 하반기: string; 최고의달: string; 주의할달: string };
    세부운세: Record<string, { rating: number; description: string }>;
    사주분석: { 오행조화: string; "2025년궁합": string };
    행운요소: { 행운의숫자: number[]; 행운의색상: string; 행운의방위: string; 행운의계절: string };
    조언: { 해야할것: string; 피해야할것: string; 명심할말: string };
  };
}

export default function FortunePage() {
  const [birthDate, setBirthDate] = useState({ year: "", month: "", day: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);

  const handleSubmit = async () => {
    if (!birthDate.year || !birthDate.month || !birthDate.day) {
      alert("생년월일을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(birthDate.year),
          month: parseInt(birthDate.month),
          day: parseInt(birthDate.day),
        }),
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
      }
    } catch {
      alert("운세 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setBirthDate({ year: "", month: "", day: "" });
    setResult(null);
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const 오행색상: Record<string, string> = {
    목: "text-green-400",
    화: "text-red-400",
    토: "text-yellow-400",
    금: "text-gray-300",
    수: "text-blue-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← 돌아가기
          </Link>
          <span className="text-2xl">🐍</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            2025 신년 운세
          </h1>
          <p className="text-gray-300 text-sm">
            사주팔자로 보는 을사년 운세
          </p>
        </div>

        {/* Input Section */}
        {!result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-center">생년월일 입력</h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">년도</label>
                <input
                  type="number"
                  placeholder="1990"
                  value={birthDate.year}
                  onChange={(e) => setBirthDate({ ...birthDate, year: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">월</label>
                <input
                  type="number"
                  placeholder="5"
                  min="1"
                  max="12"
                  value={birthDate.month}
                  onChange={(e) => setBirthDate({ ...birthDate, month: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">일</label>
                <input
                  type="number"
                  placeholder="15"
                  min="1"
                  max="31"
                  value={birthDate.day}
                  onChange={(e) => setBirthDate({ ...birthDate, day: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🔮</span> 운세 분석 중...
                </span>
              ) : (
                "🔮 2025 운세 보기"
              )}
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 기본 정보 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="text-center mb-4">
                <span className="text-6xl">{result.사주정보.띠이모지}</span>
                <h2 className="text-2xl font-bold mt-2">{result.사주정보.띠}띠</h2>
                <p className="text-gray-400 text-sm">
                  {birthDate.year}년 {birthDate.month}월 {birthDate.day}일생
                </p>
              </div>

              {/* 사주 정보 */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm bg-black/20 rounded-xl p-3 mb-4">
                <div>
                  <p className="text-gray-400">년주</p>
                  <p className="font-bold">{result.사주정보.사주.년주}</p>
                </div>
                <div>
                  <p className="text-gray-400">월주</p>
                  <p className="font-bold">{result.사주정보.사주.월주}</p>
                </div>
                <div>
                  <p className="text-gray-400">일주</p>
                  <p className="font-bold">{result.사주정보.사주.일주}</p>
                </div>
              </div>

              {/* 오행 분포 */}
              <div className="flex justify-between text-sm">
                {Object.entries(result.사주정보.오행분포).map(([오행, 값]) => (
                  <div key={오행} className="text-center">
                    <p className={`text-lg font-bold ${오행색상[오행]}`}>{오행}</p>
                    <p>{값}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 총운 */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">2025년 총운</h3>
                <span className="text-yellow-400 text-xl">
                  {renderStars(result.운세.총운.rating)}
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-yellow-500 text-black rounded-full text-sm font-bold mb-3">
                {result.운세.총운.keyword}
              </div>
              <p className="text-gray-200 leading-relaxed">{result.운세.총운.summary}</p>
            </div>

            {/* 월별 운세 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📅 월별 운세</h3>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-sm text-blue-400 font-medium">상반기 (1-6월)</p>
                  <p className="text-sm">{result.운세.월별운세.상반기}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-sm text-orange-400 font-medium">하반기 (7-12월)</p>
                  <p className="text-sm">{result.운세.월별운세.하반기}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">최고의 달</p>
                    <p className="text-lg font-bold text-green-400">{result.운세.월별운세.최고의달}</p>
                  </div>
                  <div className="flex-1 bg-red-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">주의할 달</p>
                    <p className="text-lg font-bold text-red-400">{result.운세.월별운세.주의할달}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 세부 운세 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📊 세부 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.운세.세부운세).map(([항목, 데이터]) => (
                  <div key={항목} className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">
                        {항목 === "재물운" && "💰"}
                        {항목 === "애정운" && "💕"}
                        {항목 === "직장운" && "💼"}
                        {항목 === "건강운" && "💪"}
                        {항목 === "학업운" && "📚"}
                        {" "}{항목}
                      </span>
                      <span className="text-yellow-400">{renderStars(데이터.rating)}</span>
                    </div>
                    <p className="text-sm text-gray-300">{데이터.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 행운 요소 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">🍀 행운의 요소</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">행운의 숫자</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {result.운세.행운요소.행운의숫자.join(", ")}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">행운의 색상</p>
                  <p className="text-xl font-bold">{result.운세.행운요소.행운의색상}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">행운의 방위</p>
                  <p className="text-xl font-bold">{result.운세.행운요소.행운의방위}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">행운의 계절</p>
                  <p className="text-xl font-bold">{result.운세.행운요소.행운의계절}</p>
                </div>
              </div>
            </div>

            {/* 조언 */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">💡 2025년 조언</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <p className="text-sm">{result.운세.조언.해야할것}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <p className="text-sm">{result.운세.조언.피해야할것}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">명심할 말</p>
                  <p className="font-medium text-yellow-300">"{result.운세.조언.명심할말}"</p>
                </div>
              </div>
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
                href="/"
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-bold text-center hover:opacity-90 transition"
              >
                관상 보기 👤
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 전통 사주명리학을 참고했습니다.
        </p>
      </main>
    </div>
  );
}

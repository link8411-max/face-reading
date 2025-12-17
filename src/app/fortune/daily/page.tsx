"use client";

import { useState } from "react";
import Link from "next/link";
import { fortuneDB } from "@/lib/fortuneDB";

const 띠목록 = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
const 요일목록 = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function 띠계산(year: number): string {
  const index = (year - 4) % 12;
  return 띠목록[index];
}

function 띠이모지(띠: string): string {
  const 이모지맵: Record<string, string> = {
    쥐: "🐀", 소: "🐂", 호랑이: "🐅", 토끼: "🐇", 용: "🐉", 뱀: "🐍",
    말: "🐎", 양: "🐑", 원숭이: "🐒", 닭: "🐓", 개: "🐕", 돼지: "🐷"
  };
  return 이모지맵[띠] || "🔮";
}

export default function DailyFortunePage() {
  const [birthYear, setBirthYear] = useState("");
  const [isEarlyYear, setIsEarlyYear] = useState(false); // 1-2월생 (음력 설 전)
  const [result, setResult] = useState<{
    띠: string;
    운세: { rating: number; 한마디: string; 행운시간: string; 행운색: string };
  } | null>(null);

  const today = new Date();
  const 오늘요일 = 요일목록[today.getDay()];
  const 오늘날짜 = `${today.getMonth() + 1}월 ${today.getDate()}일 ${오늘요일}`;

  const handleSubmit = () => {
    const year = parseInt(birthYear);
    if (!birthYear || isNaN(year) || year < 1920 || year > 2024) {
      alert("올바른 출생년도를 입력해주세요 (1920-2024)");
      return;
    }

    // 1-2월생이고 음력 설 전이면 전년도 띠 사용
    const 계산년도 = isEarlyYear ? year - 1 : year;
    const 띠 = 띠계산(계산년도);
    const 요일데이터 = fortuneDB.일간운세[오늘요일 as keyof typeof fortuneDB.일간운세];
    const 운세 = 요일데이터[띠 as keyof typeof 요일데이터];

    setResult({ 띠, 운세 });
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const resetAll = () => {
    setBirthYear("");
    setIsEarlyYear(false);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white relative overflow-hidden">
      {/* 별 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-1 h-1 bg-white rounded-full animate-twinkle" />
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-twinkle" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-60 left-1/4 w-1 h-1 bg-white rounded-full animate-twinkle" style={{ animationDelay: "1s" }} />
        <div className="absolute top-32 right-1/3 w-0.5 h-0.5 bg-purple-200 rounded-full animate-twinkle" style={{ animationDelay: "0.3s" }} />
        <div className="absolute top-80 left-1/2 w-1 h-1 bg-yellow-100 rounded-full animate-twinkle" style={{ animationDelay: "0.7s" }} />
        <div className="absolute top-96 right-10 w-1.5 h-1.5 bg-white rounded-full animate-twinkle" style={{ animationDelay: "1.2s" }} />
        <div className="absolute top-[500px] left-20 w-1 h-1 bg-purple-100 rounded-full animate-twinkle" style={{ animationDelay: "0.9s" }} />
        <div className="absolute top-[600px] right-1/4 w-0.5 h-0.5 bg-white rounded-full animate-twinkle" style={{ animationDelay: "0.4s" }} />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-yellow-600/70 hover:text-yellow-500 transition">
            ← 돌아가기
          </Link>
          <span className="text-2xl">🌙</span>
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-float inline-block">✨</div>
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500" style={{ textShadow: "0 0 30px rgba(251, 191, 36, 0.3)" }}>
            오늘의 운세
          </h1>
          <p className="text-yellow-100/60 text-sm tracking-wider">{오늘날짜}</p>
          <div className="flex justify-center gap-1 mt-2">
            <span className="text-yellow-500/40">─</span>
            <span className="text-yellow-400">☆</span>
            <span className="text-yellow-500/40">─</span>
          </div>
        </div>

        {/* Input Section */}
        {!result && (
          <div className="bg-gradient-to-b from-slate-900/80 to-purple-900/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-yellow-500/20 shadow-lg shadow-purple-900/30">
            <h2 className="text-lg font-bold mb-4 text-center text-yellow-100">태어난 해를 알려주세요</h2>

            <input
              type="number"
              placeholder="예: 1990"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full px-4 py-4 bg-slate-800/50 border border-yellow-600/30 rounded-xl text-center text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 mb-4 placeholder-slate-500"
            />

            {/* 음력 설 전 체크박스 */}
            <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isEarlyYear}
                onChange={(e) => setIsEarlyYear(e.target.checked)}
                className="w-5 h-5 rounded accent-yellow-500"
              />
              <span className="text-sm text-yellow-100/70">
                1~2월생이에요 (음력 설 전 출생)
              </span>
            </label>
            <p className="text-xs text-slate-500 text-center mb-4">
              * 음력 설(1월 말~2월 초) 전에 태어났다면 체크하세요
            </p>

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-500 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-amber-400 transition text-slate-900 shadow-lg shadow-yellow-600/20"
            >
              운세 보기 ✨
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 기본 정보 */}
            <div className="bg-gradient-to-b from-slate-900/80 to-purple-900/50 backdrop-blur-lg rounded-2xl p-6 text-center border border-yellow-500/20">
              <span className="text-6xl block mb-3 animate-bounce-in">{띠이모지(result.띠)}</span>
              <h2 className="text-2xl font-bold mb-1 text-yellow-100">{result.띠}띠</h2>
              <p className="text-slate-400 text-sm">
                {birthYear}년생 {isEarlyYear && "(음력 설 전)"}
              </p>
              <div className="flex justify-center gap-1 mt-3">
                <span className="text-yellow-500/40">─</span>
                <span className="text-yellow-400 animate-twinkle">☆</span>
                <span className="text-yellow-500/40">─</span>
              </div>
            </div>

            {/* 오늘의 운세 */}
            <div className="bg-gradient-to-b from-slate-900/80 to-purple-900/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-yellow-100">오늘의 운세</h3>
                <span className="text-yellow-400 text-xl tracking-wider">
                  {renderStars(result.운세.rating)}
                </span>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-yellow-600/20">
                <p className="text-xl text-center font-medium text-yellow-200">
                  "{result.운세.한마디}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-purple-500/20">
                  <p className="text-xs text-slate-400 mb-1">행운의 시간</p>
                  <p className="text-lg font-bold text-yellow-400">{result.운세.행운시간}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-purple-500/20">
                  <p className="text-xs text-slate-400 mb-1">행운의 색</p>
                  <p className="text-lg font-bold text-purple-300">{result.운세.행운색}</p>
                </div>
              </div>
            </div>

            {/* 띠별 특성 */}
            <div className="bg-gradient-to-b from-slate-900/80 to-purple-900/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/20">
              <h3 className="text-lg font-bold mb-3 text-yellow-100">✧ {result.띠}띠 특성</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].성격}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].장점.map((장점, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-500/10 text-yellow-300/80 rounded-full text-xs border border-yellow-500/20">
                    {장점}
                  </span>
                ))}
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
                className="flex-1 py-3 bg-slate-800/50 border border-yellow-500/20 rounded-xl font-bold hover:bg-slate-700/50 transition text-yellow-100/80"
              >
                다시하기
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 rounded-xl font-bold text-center hover:from-yellow-500 hover:to-amber-400 transition text-slate-900"
              >
                신년운세 🔮
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}

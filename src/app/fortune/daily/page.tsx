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
  const [result, setResult] = useState<{
    띠: string;
    운세: { rating: number; 한마디: string; 행운시간: string; 행운색: string };
  } | null>(null);

  const today = new Date();
  const 오늘요일 = 요일목록[today.getDay()];
  const 오늘날짜 = `${today.getMonth() + 1}월 ${today.getDate()}일 ${오늘요일}`;

  const handleSubmit = () => {
    const year = parseInt(birthYear);
    if (year < 1920 || year > 2024) {
      alert("올바른 출생년도를 입력해주세요 (1920-2024)");
      return;
    }

    const 띠 = 띠계산(year);
    const 요일데이터 = fortuneDB.일간운세[오늘요일 as keyof typeof fortuneDB.일간운세];
    const 운세 = 요일데이터[띠 as keyof typeof 요일데이터];

    setResult({ 띠, 운세 });
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const resetAll = () => {
    setBirthYear("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900 text-white">
      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← 돌아가기
          </Link>
          <span className="text-2xl">☀️</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            오늘의 운세
          </h1>
          <p className="text-gray-300 text-sm">{오늘날짜}</p>
        </div>

        {/* Input Section */}
        {!result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-center">태어난 해를 알려주세요</h2>

            <input
              type="number"
              placeholder="예: 1990"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full px-4 py-4 bg-white/10 rounded-xl text-center text-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            />

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-bold text-lg hover:opacity-90 transition"
            >
              오늘의 운세 보기 ✨
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 기본 정보 */}
            <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 text-center">
              <span className="text-6xl block mb-3">{띠이모지(result.띠)}</span>
              <h2 className="text-2xl font-bold mb-1">{result.띠}띠</h2>
              <p className="text-gray-400 text-sm">{birthYear}년생</p>
            </div>

            {/* 오늘의 운세 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">오늘의 운세</h3>
                <span className="text-yellow-400 text-xl">
                  {renderStars(result.운세.rating)}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-xl text-center font-medium text-yellow-300">
                  "{result.운세.한마디}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">행운의 시간</p>
                  <p className="text-lg font-bold text-orange-400">{result.운세.행운시간}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">행운의 색</p>
                  <p className="text-lg font-bold text-pink-400">{result.운세.행운색}</p>
                </div>
              </div>
            </div>

            {/* 띠별 특성 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-3">💫 {result.띠}띠 특성</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].성격}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].장점.map((장점, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs">
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
                className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition"
              >
                다시하기 🔄
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold text-center hover:opacity-90 transition"
              >
                신년운세 🔮
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}

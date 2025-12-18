"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fortuneDB } from "@/lib/fortuneDB";
import { useScreenshot } from "@/hooks/useScreenshot";

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
  const router = useRouter();
  const [birthYear, setBirthYear] = useState("");
  const [isEarlyYear, setIsEarlyYear] = useState(false);
  const [result, setResult] = useState<{
    띠: string;
    운세: { rating: number; 한마디: string; 행운시간: string; 행운색: string };
  } | null>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

  const today = new Date();
  const 오늘요일 = 요일목록[today.getDay()];
  const 오늘날짜 = `${today.getMonth() + 1}월 ${today.getDate()}일 ${오늘요일}`;

  const getShareOptions = () => ({
    fileName: `오늘의운세_${result?.띠}띠`,
    shareTitle: `오늘의 ${result?.띠}띠 운세`,
    shareText: `${오늘날짜} - ${result?.운세.한마디}`,
  });

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
    <div className="min-h-screen bg-gradient-to-b from-[#F5E6D3] via-[#E8D4C4] to-[#F5E6D3] text-[#5C4033] relative overflow-hidden">
      {/* 배경 장식 */}
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
          <button onClick={() => router.back()} className="text-[#C41E3A]/70 hover:text-[#C41E3A] transition">
            ← 돌아가기
          </button>
          <span className="text-2xl">☯</span>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-2xl animate-float">☯</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#C41E3A]" style={{ textShadow: "0 2px 8px rgba(196, 30, 58, 0.2)" }}>
            오늘의 운세
          </h1>
          <p className="text-[#5C4033]/70 text-sm tracking-widest">{오늘날짜}</p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-[#FFD700]/80 text-xs">◆</span>
            <span className="text-[#C41E3A]/60 text-xs">━━━━━</span>
            <span className="text-[#FFD700]/80 text-xs">◆</span>
          </div>
        </div>

        {/* Input Section */}
        {!result && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border-2 border-[#C41E3A]/30 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-center text-[#5C4033]">태어난 해를 알려주세요</h2>

            <input
              type="number"
              placeholder="예: 1990"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full px-4 py-4 bg-white/50 border border-[#C41E3A]/30 rounded-xl text-center text-2xl text-[#5C4033] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50 focus:border-[#C41E3A]/50 mb-4 placeholder-[#5C4033]/40"
            />

            {/* 음력 설 전 체크박스 */}
            <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isEarlyYear}
                onChange={(e) => setIsEarlyYear(e.target.checked)}
                className="w-5 h-5 rounded accent-[#C41E3A]"
              />
              <span className="text-sm text-[#5C4033]/70">
                1~2월생이에요 (음력 설 전 출생)
              </span>
            </label>
            <p className="text-xs text-[#5C4033]/50 text-center mb-4">
              * 음력 설(1월 말~2월 초) 전에 태어났다면 체크하세요
            </p>

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-xl font-bold text-lg hover:shadow-xl transition text-white shadow-lg"
            >
              운세 보기 ☯
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 캡쳐 영역 시작 */}
            <div ref={resultRef} className="space-y-4 bg-[#F5E6D3] p-4 -m-4">
            {/* 기본 정보 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 text-center border-2 border-[#C41E3A]/30 shadow-lg">
              <span className="text-6xl block mb-3 animate-bounce-in">{띠이모지(result.띠)}</span>
              <h2 className="text-2xl font-bold mb-1 text-[#C41E3A]">{result.띠}띠</h2>
              <p className="text-[#5C4033]/70 text-sm">
                {birthYear}년생 {isEarlyYear && "(음력 설 전)"}
              </p>
              <div className="flex justify-center gap-1 mt-3">
                <span className="text-[#C41E3A]/60">─</span>
                <span className="text-[#FFD700]">☯</span>
                <span className="text-[#C41E3A]/60">─</span>
              </div>
            </div>

            {/* 오늘의 운세 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/40 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#C41E3A]">오늘의 운세</h3>
                <span className="text-[#FFD700] text-xl tracking-wider">
                  {renderStars(result.운세.rating)}
                </span>
              </div>

              <div className="bg-white/50 rounded-xl p-4 mb-4 border border-[#FFD700]/40">
                <p className="text-xl text-center font-medium text-[#C41E3A]">
                  "{result.운세.한마디}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60 mb-1">행운의 시간</p>
                  <p className="text-lg font-bold text-[#FFD700]">{result.운세.행운시간}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60 mb-1">행운의 색</p>
                  <p className="text-lg font-bold text-[#C41E3A]">{result.운세.행운색}</p>
                </div>
              </div>
            </div>

            {/* 띠별 특성 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-[#C41E3A]">☯ {result.띠}띠 특성</h3>
              <p className="text-[#5C4033]/80 text-sm leading-relaxed">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].성격}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].장점.map((장점, i) => (
                  <span key={i} className="px-3 py-1 bg-[#C41E3A]/15 text-[#C41E3A] rounded-full text-xs border border-[#C41E3A]/30">
                    {장점}
                  </span>
                ))}
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
                className="flex-1 py-3 bg-gradient-to-r from-green-700 to-green-600 rounded-xl font-bold text-center hover:shadow-xl transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📥 이미지 저장"}
              </button>
              <button
                onClick={() => share(getShareOptions())}
                disabled={isCapturing}
                className="flex-1 py-3 bg-gradient-to-r from-[#1E3A5F] to-blue-600 rounded-xl font-bold text-center hover:shadow-xl transition text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCapturing ? "⏳ 캡쳐중..." : "📤 오늘 운세 친구에게 공유"}
              </button>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/60 border-2 border-[#C41E3A]/30 rounded-xl font-bold hover:bg-white/80 transition text-[#5C4033]"
              >
                다시하기
              </button>
              <Link
                href="/fortune"
                className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-xl font-bold text-center hover:shadow-xl transition text-white"
              >
                신년운세 🔮
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[#5C4033]/50 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.
        </p>
      </main>
    </div>
  );
}

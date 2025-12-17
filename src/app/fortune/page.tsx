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
    역법: string;
    시주: string | null;
  };
  운세: {
    총운: { rating: number; keyword: string; summary: string };
    월별운세: { 상반기: string; 하반기: string; 최고의달: string; 주의할달: string };
    세부운세: Record<string, { rating: number; description: string }>;
    사주분석: { 오행조화: string; "2026년궁합": string };
    행운요소: { 행운의숫자: number[]; 행운의색상: string; 행운의방위: string; 행운의계절: string };
    조언: { 해야할것: string; 피해야할것: string; 명심할말: string };
  };
}

export default function FortunePage() {
  const [birthDate, setBirthDate] = useState({ year: "", month: "", day: "" });
  const [birthHour, setBirthHour] = useState<string>("모름");
  const [isLunar, setIsLunar] = useState(false);
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
          hour: birthHour,
          isLunar,
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
    setBirthHour("모름");
    setIsLunar(false);
    setResult(null);
  };

  // 시간 옵션 (12지지 시간)
  const hourOptions = [
    { value: "모름", label: "모름" },
    { value: "자시", label: "자시 (23:00-01:00)" },
    { value: "축시", label: "축시 (01:00-03:00)" },
    { value: "인시", label: "인시 (03:00-05:00)" },
    { value: "묘시", label: "묘시 (05:00-07:00)" },
    { value: "진시", label: "진시 (07:00-09:00)" },
    { value: "사시", label: "사시 (09:00-11:00)" },
    { value: "오시", label: "오시 (11:00-13:00)" },
    { value: "미시", label: "미시 (13:00-15:00)" },
    { value: "신시", label: "신시 (15:00-17:00)" },
    { value: "유시", label: "유시 (17:00-19:00)" },
    { value: "술시", label: "술시 (19:00-21:00)" },
    { value: "해시", label: "해시 (21:00-23:00)" },
  ];

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
          <span className="text-2xl">🐎</span>
        </div>

        <div className="text-center mb-8">
          {/* 전통 장식 */}
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-amber-600/60">━━</span>
            <span className="text-2xl">☯</span>
            <span className="text-amber-600/60">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200" style={{ textShadow: "0 0 30px rgba(251, 191, 36, 0.3)" }}>
            2026 신년 운세
          </h1>
          <p className="text-amber-100/60 text-sm tracking-widest">
            병오년 · 사주팔자로 보는 새해 운세
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-red-800/60 text-xs">◆</span>
            <span className="text-amber-600/60 text-xs">━━━━━</span>
            <span className="text-red-800/60 text-xs">◆</span>
          </div>
        </div>

        {/* Input Section */}
        {!result && (
          <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-amber-600/20 shadow-lg shadow-red-950/30">
            <h2 className="text-lg font-bold mb-4 text-center text-amber-100">생년월일 입력</h2>

            {/* 음력/양력 선택 */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setIsLunar(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  !isLunar
                    ? "bg-amber-600 text-stone-900"
                    : "bg-stone-800/50 text-amber-100/50 hover:bg-stone-700/50 border border-amber-600/20"
                }`}
              >
                ☀️ 양력
              </button>
              <button
                onClick={() => setIsLunar(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  isLunar
                    ? "bg-red-700 text-amber-100"
                    : "bg-stone-800/50 text-amber-100/50 hover:bg-stone-700/50 border border-amber-600/20"
                }`}
              >
                🌙 음력
              </button>
            </div>
            {isLunar && (
              <p className="text-xs text-center text-red-300 mb-4">
                ✓ 전통 사주명리학은 음력 기준입니다
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm text-amber-100/60 mb-1">년도</label>
                <input
                  type="number"
                  placeholder="1990"
                  value={birthDate.year}
                  onChange={(e) => setBirthDate({ ...birthDate, year: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-800/50 border border-amber-600/30 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-stone-500"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-100/60 mb-1">월</label>
                <input
                  type="number"
                  placeholder="5"
                  min="1"
                  max="12"
                  value={birthDate.month}
                  onChange={(e) => setBirthDate({ ...birthDate, month: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-800/50 border border-amber-600/30 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-stone-500"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-100/60 mb-1">일</label>
                <input
                  type="number"
                  placeholder="15"
                  min="1"
                  max="31"
                  value={birthDate.day}
                  onChange={(e) => setBirthDate({ ...birthDate, day: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-800/50 border border-amber-600/30 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-stone-500"
                />
              </div>
            </div>

            {/* 태어난 시간 */}
            <div className="mb-6">
              <label className="block text-sm text-amber-100/60 mb-1">태어난 시간 (시주)</label>
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                className="w-full px-4 py-3 bg-stone-800/50 border border-amber-600/30 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none cursor-pointer"
              >
                {hourOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-stone-800">
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-stone-500 mt-1 text-center">
                모르면 &apos;모름&apos; 선택 (시주 제외하고 분석)
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-700 to-amber-600 rounded-xl font-bold text-lg hover:from-red-600 hover:to-amber-500 transition disabled:opacity-50 text-amber-100 shadow-lg shadow-red-900/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">☯</span> 사주 분석 중...
                </span>
              ) : (
                "운세 보기 ☯"
              )}
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 기본 정보 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <div className="text-center mb-4">
                <span className="text-6xl">{result.사주정보.띠이모지}</span>
                <h2 className="text-2xl font-bold mt-2 text-amber-100">{result.사주정보.띠}띠</h2>
                <p className="text-stone-400 text-sm">
                  {birthDate.year}년 {birthDate.month}월 {birthDate.day}일생
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    result.사주정보.역법 === "음력"
                      ? "bg-red-700/30 text-red-300"
                      : "bg-amber-600/30 text-amber-300"
                  }`}>
                    {result.사주정보.역법 === "음력" ? "🌙 음력" : "☀️ 양력"}
                  </span>
                </p>
              </div>

              {/* 사주 정보 */}
              <div className={`grid ${result.사주정보.시주 ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center text-sm bg-stone-900/50 rounded-xl p-3 mb-4 border border-amber-600/10`}>
                <div>
                  <p className="text-stone-500 text-xs">년주</p>
                  <p className="font-bold text-amber-100">{result.사주정보.사주.년주}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">월주</p>
                  <p className="font-bold text-amber-100">{result.사주정보.사주.월주}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">일주</p>
                  <p className="font-bold text-amber-100">{result.사주정보.사주.일주}</p>
                </div>
                {result.사주정보.시주 && (
                  <div>
                    <p className="text-stone-500 text-xs">시주</p>
                    <p className="font-bold text-amber-400">{result.사주정보.시주}</p>
                  </div>
                )}
              </div>

              {/* 오행 분포 */}
              <div className="flex justify-between text-sm bg-stone-900/30 rounded-xl p-3">
                {Object.entries(result.사주정보.오행분포).map(([오행, 값]) => (
                  <div key={오행} className="text-center">
                    <p className={`text-lg font-bold ${오행색상[오행]}`}>{오행}</p>
                    <p className="text-stone-400">{값}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 총운 */}
            <div className="bg-gradient-to-r from-red-900/40 to-amber-900/40 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-amber-100">2026년 총운</h3>
                <span className="text-amber-400 text-xl tracking-wider">
                  {renderStars(result.운세.총운.rating)}
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-red-700 to-amber-600 text-amber-100 rounded-full text-sm font-bold mb-3">
                {result.운세.총운.keyword}
              </div>
              <p className="text-stone-300 leading-relaxed">{result.운세.총운.summary}</p>
            </div>

            {/* 월별 운세 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">월별 운세</h3>
              <div className="space-y-3">
                <div className="bg-stone-900/50 rounded-xl p-3 border border-amber-600/10">
                  <p className="text-sm text-amber-400 font-medium">상반기 (1-6월)</p>
                  <p className="text-sm text-stone-300">{result.운세.월별운세.상반기}</p>
                </div>
                <div className="bg-stone-900/50 rounded-xl p-3 border border-amber-600/10">
                  <p className="text-sm text-red-400 font-medium">하반기 (7-12월)</p>
                  <p className="text-sm text-stone-300">{result.운세.월별운세.하반기}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-emerald-900/30 rounded-xl p-3 text-center border border-emerald-600/20">
                    <p className="text-xs text-stone-400">최고의 달</p>
                    <p className="text-lg font-bold text-emerald-400">{result.운세.월별운세.최고의달}</p>
                  </div>
                  <div className="flex-1 bg-red-900/30 rounded-xl p-3 text-center border border-red-600/20">
                    <p className="text-xs text-stone-400">주의할 달</p>
                    <p className="text-lg font-bold text-red-400">{result.운세.월별운세.주의할달}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 세부 운세 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">세부 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.운세.세부운세).map(([항목, 데이터]) => (
                  <div key={항목} className="bg-stone-900/50 rounded-xl p-4 border border-amber-600/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-amber-100">
                        {항목 === "재물운" && "💰 "}
                        {항목 === "애정운" && "💕 "}
                        {항목 === "직장운" && "💼 "}
                        {항목 === "건강운" && "💪 "}
                        {항목 === "학업운" && "📚 "}
                        {항목}
                      </span>
                      <span className="text-amber-400">{renderStars(데이터.rating)}</span>
                    </div>
                    <p className="text-sm text-stone-300">{데이터.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 행운 요소 */}
            <div className="bg-gradient-to-b from-stone-900/80 to-red-950/50 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">행운 요소</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-900/50 rounded-xl p-3 text-center border border-amber-600/10">
                  <p className="text-xs text-stone-400">행운의 숫자</p>
                  <p className="text-xl font-bold text-amber-400">
                    {result.운세.행운요소.행운의숫자.join(", ")}
                  </p>
                </div>
                <div className="bg-stone-900/50 rounded-xl p-3 text-center border border-amber-600/10">
                  <p className="text-xs text-stone-400">행운의 색상</p>
                  <p className="text-xl font-bold text-amber-100">{result.운세.행운요소.행운의색상}</p>
                </div>
                <div className="bg-stone-900/50 rounded-xl p-3 text-center border border-amber-600/10">
                  <p className="text-xs text-stone-400">행운의 방위</p>
                  <p className="text-xl font-bold text-amber-100">{result.운세.행운요소.행운의방위}</p>
                </div>
                <div className="bg-stone-900/50 rounded-xl p-3 text-center border border-amber-600/10">
                  <p className="text-xs text-stone-400">행운의 계절</p>
                  <p className="text-xl font-bold text-amber-100">{result.운세.행운요소.행운의계절}</p>
                </div>
              </div>
            </div>

            {/* 조언 */}
            <div className="bg-gradient-to-r from-red-900/40 to-amber-900/40 backdrop-blur-lg rounded-2xl p-6 border border-amber-600/20">
              <h3 className="text-lg font-bold mb-4 text-amber-100">2026년 조언</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  <p className="text-sm text-stone-300">{result.운세.조언.해야할것}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <p className="text-sm text-stone-300">{result.운세.조언.피해야할것}</p>
                </div>
                <div className="bg-stone-900/50 rounded-xl p-4 text-center border border-amber-600/20">
                  <p className="text-xs text-stone-500 mb-1">명심할 말</p>
                  <p className="font-medium text-amber-300">"{result.운세.조언.명심할말}"</p>
                </div>
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
                className="flex-1 py-3 bg-stone-800/50 border border-amber-600/20 rounded-xl font-bold hover:bg-stone-700/50 transition text-amber-100/80"
              >
                다시하기
              </button>
              <Link
                href="/face"
                className="flex-1 py-3 bg-gradient-to-r from-red-700 to-amber-600 rounded-xl font-bold text-center hover:from-red-600 hover:to-amber-500 transition text-amber-100"
              >
                관상 보기 👤
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-stone-600 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 전통 사주명리학을 참고했습니다.
        </p>
      </main>
    </div>
  );
}

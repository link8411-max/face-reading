"use client";

import { useState } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import BirthDateFields from "@/components/BirthDateFields";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";
import { SLUG_BY_띠 } from "@/content/fortune2027Zodiac";
import { validateBirthDate } from "@/lib/birthDate";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";

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
    양력: { year: number; month: number; day: number };
    시주: string | null;
  };
  운세: {
    총운: { rating: number; keyword: string; summary: string };
    월별운세: { 상반기: string; 하반기: string; 최고의달: string; 주의할달: string };
    세부운세: Record<string, { rating: number; description: string }>;
    사주분석: { 오행조화: string; 올해궁합: string };
    행운요소: { 행운의숫자: number[]; 행운의색상: string; 행운의방위: string; 행운의계절: string };
    조언: { 해야할것: string; 피해야할것: string; 명심할말: string };
  };
}

export default function FortuneClient() {
  const goBack = useBackOrHome();
  const [birthDate, setBirthDate] = useState({ year: "", month: "", day: "" });
  const [birthHour, setBirthHour] = useState<string>("모름");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const dateCheck = validateBirthDate(birthDate, new Date(), { lunar: isLunar });
  const [result, setResult] = useState<FortuneResult | null>(null);

  const { ref: resultRef, isCapturing, download, share } = useScreenshot();

  const getShareOptions = () => ({
    fileName: `${FORTUNE_YEAR.year}년운세_${result?.사주정보.띠}띠`,
    shareTitle: `${FORTUNE_YEAR.year}년 ${result?.사주정보.띠}띠 운세`,
    shareText: `${result?.운세.총운.keyword} - ${result?.운세.총운.summary}`,
  });

  const handleSubmit = async () => {
    if (!dateCheck.ok) return;

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
          isLeapMonth: isLunar && isLeapMonth,
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
          <button
            onClick={() => result ? resetAll() : goBack()}
            className="text-[#C41E3A]/70 hover:text-[#C41E3A] transition"
          >
            ← {result ? '다시하기' : '돌아가기'}
          </button>
          <span className="text-2xl">{FORTUNE_YEAR.띠이모지}</span>
        </div>

        <div className="text-center mb-8">
          {/* 전통 장식 */}
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-2xl">☯</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[#C41E3A]" style={{ textShadow: "0 2px 8px rgba(196, 30, 58, 0.2)" }}>
            {FORTUNE_YEAR.year} 신년 운세
          </h1>
          <p className="text-[#5C4033]/70 text-sm tracking-widest">
            {FORTUNE_YEAR.간지}년 · 사주팔자로 보는 새해 운세
          </p>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-[#FFD700]/80 text-xs">◆</span>
            <span className="text-[#C41E3A]/60 text-xs">━━━━━</span>
            <span className="text-[#FFD700]/80 text-xs">◆</span>
          </div>
        </div>

        {/* Input Section */}
        {!result && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border-2 border-[#C41E3A]/30 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-center text-[#5C4033]">생년월일 입력</h2>

            {/* 음력/양력 선택 */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setIsLunar(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  !isLunar
                    ? "bg-[#FFD700] text-[#5C4033]"
                    : "bg-white/50 text-[#5C4033]/50 hover:bg-white/70 border border-[#FFD700]/30"
                }`}
              >
                ☀️ 양력
              </button>
              <button
                onClick={() => setIsLunar(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  isLunar
                    ? "bg-[#C41E3A] text-white"
                    : "bg-white/50 text-[#5C4033]/50 hover:bg-white/70 border border-[#C41E3A]/30"
                }`}
              >
                🌙 음력
              </button>
            </div>
            {isLunar && (
              <div className="mb-4 text-center">
                <label className="inline-flex items-center gap-2 text-sm text-[#5C4033]/80 cursor-pointer">
                  <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} className="w-4 h-4 accent-[#C41E3A]" />
                  윤달이에요
                </label>
                <p className="text-xs text-[#5C4033]/60 mt-1">음력 생일은 양력으로 바꿔서 사주를 계산해요</p>
              </div>
            )}

            <BirthDateFields value={birthDate} onChange={setBirthDate} error={dateCheck.error} />

            {/* 태어난 시간 */}
            <div className="mb-6">
              <label className="block text-sm text-[#5C4033]/70 mb-1">태어난 시간 (시주)</label>
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-[#C41E3A]/30 rounded-xl text-center text-lg text-[#5C4033] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50 appearance-none cursor-pointer"
              >
                {hourOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#5C4033]/50 mt-1 text-center">
                모르면 &apos;모름&apos; 선택 (시주 제외하고 분석)
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !dateCheck.ok}
              className="w-full py-3 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50 text-white shadow-lg"
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
            {/* 캡쳐 영역 시작 */}
            <div ref={resultRef} className="space-y-4 bg-[#F5E6D3] p-4 -m-4">
            {/* 기본 정보 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <div className="text-center mb-4">
                <span className="text-6xl">{result.사주정보.띠이모지}</span>
                <h2 className="text-2xl font-bold mt-2 text-[#C41E3A]">{result.사주정보.띠}띠</h2>
                <p className="text-[#5C4033]/70 text-sm">
                  {birthDate.year}년 {birthDate.month}월 {birthDate.day}일생
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    result.사주정보.역법.startsWith("음력")
                      ? "bg-[#C41E3A]/15 text-[#C41E3A]"
                      : "bg-[#FFD700]/15 text-[#D4AF37]"
                  }`}>
                    {result.사주정보.역법.startsWith("음력") ? `🌙 ${result.사주정보.역법}` : "☀️ 양력"}
                  </span>
                </p>
                {result.사주정보.역법.startsWith("음력") && (
                  <p className="text-xs text-[#5C4033]/60 mt-1">
                    양력 {result.사주정보.양력.year}년 {result.사주정보.양력.month}월 {result.사주정보.양력.day}일로 계산했어요
                  </p>
                )}
              </div>

              {/* 사주 정보 */}
              <div className={`grid ${result.사주정보.시주 ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center text-sm bg-white/50 rounded-xl p-3 mb-4 border border-[#C41E3A]/20`}>
                <div>
                  <p className="text-[#5C4033]/50 text-xs">년주</p>
                  <p className="font-bold text-[#5C4033]">{result.사주정보.사주.년주}</p>
                </div>
                <div>
                  <p className="text-[#5C4033]/50 text-xs">월주</p>
                  <p className="font-bold text-[#5C4033]">{result.사주정보.사주.월주}</p>
                </div>
                <div>
                  <p className="text-[#5C4033]/50 text-xs">일주</p>
                  <p className="font-bold text-[#5C4033]">{result.사주정보.사주.일주}</p>
                </div>
                {result.사주정보.시주 && (
                  <div>
                    <p className="text-[#5C4033]/50 text-xs">시주</p>
                    <p className="font-bold text-[#FFD700]">{result.사주정보.시주}</p>
                  </div>
                )}
              </div>

              {/* 오행 분포 */}
              <div className="flex justify-between text-sm bg-white/50 rounded-xl p-3">
                {Object.entries(result.사주정보.오행분포).map(([오행, 값]) => (
                  <div key={오행} className="text-center">
                    <p className={`text-lg font-bold ${오행색상[오행]}`}>{오행}</p>
                    <p className="text-[#5C4033]/70">{값}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 총운 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/40 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-[#C41E3A]">{FORTUNE_YEAR.year}년 총운</h3>
                <span className="text-[#FFD700] text-xl tracking-wider">
                  {renderStars(result.운세.총운.rating)}
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] text-white rounded-full text-sm font-bold mb-3">
                {result.운세.총운.keyword}
              </div>
              <p className="text-[#5C4033]/80 leading-relaxed">{result.운세.총운.summary}</p>
            </div>

            {/* 월별 운세 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">월별 운세</h3>
              <div className="space-y-3">
                <div className="bg-white/50 rounded-xl p-3 border border-[#FFD700]/30">
                  <p className="text-sm text-[#D4AF37] font-medium">상반기 (1-6월)</p>
                  <p className="text-sm text-[#5C4033]/80">{result.운세.월별운세.상반기}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 border border-[#C41E3A]/30">
                  <p className="text-sm text-[#C41E3A] font-medium">하반기 (7-12월)</p>
                  <p className="text-sm text-[#5C4033]/80">{result.운세.월별운세.하반기}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-700/15 rounded-xl p-3 text-center border border-green-700/30">
                    <p className="text-xs text-[#5C4033]/60">최고의 달</p>
                    <p className="text-lg font-bold text-green-700">{result.운세.월별운세.최고의달}</p>
                  </div>
                  <div className="flex-1 bg-[#C41E3A]/15 rounded-xl p-3 text-center border border-[#C41E3A]/30">
                    <p className="text-xs text-[#5C4033]/60">주의할 달</p>
                    <p className="text-lg font-bold text-[#C41E3A]">{result.운세.월별운세.주의할달}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 세부 운세 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">세부 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.운세.세부운세).map(([항목, 데이터]) => (
                  <div key={항목} className="bg-white/50 rounded-xl p-4 border border-[#FFD700]/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-[#5C4033]">
                        {항목 === "재물운" && "💰 "}
                        {항목 === "애정운" && "💕 "}
                        {항목 === "직장운" && "💼 "}
                        {항목 === "건강운" && "💪 "}
                        {항목 === "학업운" && "📚 "}
                        {항목}
                      </span>
                      <span className="text-[#FFD700]">{renderStars(데이터.rating)}</span>
                    </div>
                    <p className="text-sm text-[#5C4033]/80">{데이터.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 행운 요소 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#FFD700]/40 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">행운 요소</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60">행운의 숫자</p>
                  <p className="text-xl font-bold text-[#FFD700]">
                    {result.운세.행운요소.행운의숫자.join(", ")}
                  </p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60">행운의 색상</p>
                  <p className="text-xl font-bold text-[#5C4033]">{result.운세.행운요소.행운의색상}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60">행운의 방위</p>
                  <p className="text-xl font-bold text-[#5C4033]">{result.운세.행운요소.행운의방위}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-3 text-center border border-[#FFD700]/30">
                  <p className="text-xs text-[#5C4033]/60">행운의 계절</p>
                  <p className="text-xl font-bold text-[#5C4033]">{result.운세.행운요소.행운의계절}</p>
                </div>
              </div>
            </div>

            {/* 조언 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border-2 border-[#C41E3A]/30 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-[#C41E3A]">{FORTUNE_YEAR.year}년 조언</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-green-700">✓</span>
                  <p className="text-sm text-[#5C4033]/80">{result.운세.조언.해야할것}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[#C41E3A]">✗</span>
                  <p className="text-sm text-[#5C4033]/80">{result.운세.조언.피해야할것}</p>
                </div>
                <div className="bg-white/50 rounded-xl p-4 text-center border border-[#FFD700]/40">
                  <p className="text-xs text-[#5C4033]/50 mb-1">명심할 말</p>
                  <p className="font-medium text-[#C41E3A]">"{result.운세.조언.명심할말}"</p>
                </div>
              </div>
            </div>

            <CoupangBanner subId="fortune" />
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
                {isCapturing ? "⏳ 캡쳐중..." : `📤 ${FORTUNE_YEAR.year} 운세 카톡으로 보내기`}
              </button>
            </div>

            {/* 버튼 */}
            <Link
              href={`/fortune/2027/${SLUG_BY_띠[result.사주정보.띠]}`}
              className="block w-full mb-3 py-3 text-center bg-white/60 border-2 border-[#C41E3A]/30 rounded-xl font-bold text-[#C41E3A] hover:bg-white/80 transition"
            >
              {result.사주정보.띠이모지} {result.사주정보.띠}띠 {FORTUNE_YEAR.year} 운세 자세히 보기 →
            </Link>
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 py-3 bg-white/60 border-2 border-[#C41E3A]/30 rounded-xl font-bold hover:bg-white/80 transition text-[#5C4033]"
              >
                다시하기
              </button>
              <Link
                href="/face2"
                className="flex-1 py-3 bg-gradient-to-r from-[#C41E3A] to-[#FFD700] rounded-xl font-bold text-center hover:shadow-xl transition text-white"
              >
                관상 보기 👤
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[#5C4033]/50 text-xs mt-8">
          ⚠️ 재미로만 봐주세요! 전통 사주명리학을 참고했습니다.
        </p>
      </main>
    </div>
  );
}

"use client";

import SeasonPicks from "@/components/SeasonPicks";
import { track } from "@/lib/analytics";
import { useState } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import { Icon } from "@/components/icons";
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

  const { ref: resultRef, isCapturing, download, share, shareNotice } = useScreenshot(result);

  const getShareOptions = () => ({
    fileName: `${FORTUNE_YEAR.year}년운세_${result?.사주정보.띠}띠`,
    shareTitle: `${FORTUNE_YEAR.year}년 ${result?.사주정보.띠}띠 운세`,
    shareText: `${result?.운세.총운.keyword} - ${result?.운세.총운.summary}`,
  });

  const handleSubmit = async () => {
    if (!dateCheck.ok) return;

    setLoading(true);
    track("fortune_submit", { test_name: "fortune" });
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
        track("result_view", { test_name: "fortune", result_id: data.사주정보?.띠 });
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
    setIsLeapMonth(false);
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
    목: "text-[#5F6B4E]",
    화: "text-accent",
    토: "text-[#8A6A3B]",
    금: "text-muted",
    수: "text-[#3F5468]",
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-6">
        <TestHeader title={`${FORTUNE_YEAR.year} 신년 운세`} onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />
        {!result && (
          <div className="mt-2.5 mb-6">
            <h2 className="font-serif font-bold text-[27px] leading-[1.4] break-keep">생년월일로 보는<br />{FORTUNE_YEAR.year} 내 운세</h2>
            <p className="mt-2.5 text-sm text-muted">{FORTUNE_YEAR.간지}년 · 사주와 오행으로 풀어 보는 새해 운세</p>
          </div>
        )}

        {/* Input Section */}
        {!result && (
          <div className="bg-white rounded-[28px] p-6 mb-6 border border-line">
            <h3 className="font-serif font-bold text-lg mb-4 text-center">생년월일 입력</h3>

            {/* 음력/양력 선택 */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setIsLunar(false)}
                aria-pressed={!isLunar}
                className={`h-11 px-5 rounded-full text-sm font-medium border transition ${!isLunar ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line"}`}
              >
                양력
              </button>
              <button
                onClick={() => setIsLunar(true)}
                aria-pressed={isLunar}
                className={`h-11 px-5 rounded-full text-sm font-medium border transition ${isLunar ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line"}`}
              >
                음력
              </button>
            </div>
            {isLunar && (
              <div className="mb-4 text-center">
                <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} className="w-4 h-4 accent-accent" />
                  윤달이에요
                </label>
                <p className="text-xs text-muted mt-1">음력 생일은 양력으로 바꿔서 사주를 계산해요</p>
              </div>
            )}

            <BirthDateFields value={birthDate} onChange={setBirthDate} error={dateCheck.error} />

            {/* 태어난 시간 */}
            <div className="mb-6">
              <label className="block text-sm text-muted mb-1">태어난 시간 (시주)</label>
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(e.target.value)}
                className="w-full px-4 py-3 bg-card-2 border border-line rounded-xl text-center text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none cursor-pointer"
              >
                {hourOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1 text-center">
                모르면 &apos;모름&apos; 선택 (시주 제외하고 분석)
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !dateCheck.ok}
              className="w-full h-[52px] bg-ink rounded-full font-medium text-[15px] disabled:opacity-45 text-paper"
            >
              {loading ? "사주 분석 중…" : "운세 보기"}
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 캡쳐 영역 시작 */}
            <div ref={resultRef} className="space-y-3 bg-card rounded-[30px] p-4">
            {/* 기본 정보 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <div className="text-center mb-4">
                <p className="text-xs font-medium text-accent">{FORTUNE_YEAR.year} {FORTUNE_YEAR.간지}년 신년운세</p>
                <h2 className="font-serif text-[25px] font-bold mt-1">{result.사주정보.띠}띠</h2>
                {/* 생년월일은 화면에만, 저장·공유 이미지에는 넣지 않는다 */}
                <p className="text-muted text-sm no-screenshot">
                  {birthDate.year}년 {birthDate.month}월 {birthDate.day}일생
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    result.사주정보.역법.startsWith("음력")
                      ? "bg-card-2 text-accent"
                      : "bg-card-2 text-accent"
                  }`}>
                    {result.사주정보.역법.startsWith("음력") ? result.사주정보.역법 : "양력"}
                  </span>
                </p>
                {result.사주정보.역법.startsWith("음력") && (
                  <p className="text-xs text-muted mt-1">
                    양력 {result.사주정보.양력.year}년 {result.사주정보.양력.month}월 {result.사주정보.양력.day}일로 계산했어요
                  </p>
                )}
              </div>

              {/* 사주 정보 */}
              <div className={`grid ${result.사주정보.시주 ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center text-sm bg-card-2 rounded-xl p-3 mb-4 border border-line`}>
                <div>
                  <p className="text-muted text-xs">년주</p>
                  <p className="font-bold text-ink">{result.사주정보.사주.년주}</p>
                </div>
                <div>
                  <p className="text-muted text-xs">월주</p>
                  <p className="font-bold text-ink">{result.사주정보.사주.월주}</p>
                </div>
                <div>
                  <p className="text-muted text-xs">일주</p>
                  <p className="font-bold text-ink">{result.사주정보.사주.일주}</p>
                </div>
                {result.사주정보.시주 && (
                  <div>
                    <p className="text-muted text-xs">시주</p>
                    <p className="font-bold text-accent">{result.사주정보.시주}</p>
                  </div>
                )}
              </div>

              {/* 오행 분포 */}
              <div className="flex justify-between text-sm bg-card-2 rounded-xl p-3">
                {Object.entries(result.사주정보.오행분포).map(([오행, 값]) => (
                  <div key={오행} className="text-center">
                    <p className={`text-lg font-bold ${오행색상[오행]}`}>{오행}</p>
                    <p className="text-muted">{값}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 총운 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-serif font-bold text-lg">{FORTUNE_YEAR.year}년 총운</h3>
                <span className="text-accent text-xl tracking-wider">
                  {renderStars(result.운세.총운.rating)}
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-ink text-white rounded-full text-sm font-bold mb-3">
                {result.운세.총운.keyword}
              </div>
              <p className="text-muted leading-relaxed">{result.운세.총운.summary}</p>
            </div>

              <div className="flex justify-between items-center px-1 text-[11px] text-muted">
                <span className="font-serif font-bold text-xs text-ink">운명을 읽다</span>
                <span>unse-ai.com</span>
              </div>
            </div>
            {/* 캡쳐 영역 끝: 요약(사주·총운) 한 장 */}

            <div className="no-screenshot flex flex-col">
              <button
                onClick={() => { track("share_click", { test_name: "fortune", method: "share" }); share(getShareOptions()); }}
                disabled={isCapturing}
                className="h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium disabled:opacity-50"
              >
                <Icon name="share" size={18} />
                {isCapturing ? "이미지 만드는 중…" : `${FORTUNE_YEAR.year} 운세 공유하기`}
              </button>
              {shareNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{shareNotice}</p>}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => { track("share_click", { test_name: "fortune", method: "save_image" }); download(getShareOptions()); }} disabled={isCapturing} className="h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Icon name="download" size={16} />
                  이미지 저장
                </button>
                <button onClick={resetAll} className="h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5">
                  <Icon name="refresh" size={16} />
                  다시하기
                </button>
              </div>
            </div>

            {/* 월별 운세 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <h3 className="font-serif font-bold text-lg mb-3">월별 운세</h3>
              <div className="space-y-3">
                <div className="bg-card-2 rounded-xl p-3 border border-line">
                  <p className="text-sm text-accent font-medium">상반기 (1-6월)</p>
                  <p className="text-sm text-muted">{result.운세.월별운세.상반기}</p>
                </div>
                <div className="bg-card-2 rounded-xl p-3 border border-line">
                  <p className="text-sm text-accent font-medium">하반기 (7-12월)</p>
                  <p className="text-sm text-muted">{result.운세.월별운세.하반기}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-card-2 rounded-xl p-3 text-center border border-line">
                    <p className="text-xs text-muted">최고의 달</p>
                    <p className="text-lg font-bold text-ink">{result.운세.월별운세.최고의달}</p>
                  </div>
                  <div className="flex-1 bg-card-2 rounded-xl p-3 text-center border border-line">
                    <p className="text-xs text-muted">주의할 달</p>
                    <p className="text-lg font-bold text-accent">{result.운세.월별운세.주의할달}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 세부 운세 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <h3 className="font-serif font-bold text-lg mb-3">세부 운세</h3>
              <div className="space-y-4">
                {Object.entries(result.운세.세부운세).map(([항목, 데이터]) => (
                  <div key={항목} className="bg-card-2 rounded-xl p-4 border border-line">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-ink">
                        {항목}
                      </span>
                      <span className="text-accent">{renderStars(데이터.rating)}</span>
                    </div>
                    <p className="text-sm text-muted">{데이터.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 학업·직장운 옆: 시즌 추천(수능 합격 선물) */}
            <SeasonPicks slot="fortune" />

            {/* 행운 요소 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <h3 className="font-serif font-bold text-lg mb-3">행운 요소</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card-2 rounded-xl p-3 text-center border border-line">
                  <p className="text-xs text-muted">행운의 숫자</p>
                  <p className="text-xl font-bold text-accent">
                    {result.운세.행운요소.행운의숫자.join(", ")}
                  </p>
                </div>
                <div className="bg-card-2 rounded-xl p-3 text-center border border-line">
                  <p className="text-xs text-muted">행운의 색상</p>
                  <p className="text-xl font-bold text-ink">{result.운세.행운요소.행운의색상}</p>
                </div>
                <div className="bg-card-2 rounded-xl p-3 text-center border border-line">
                  <p className="text-xs text-muted">행운의 방위</p>
                  <p className="text-xl font-bold text-ink">{result.운세.행운요소.행운의방위}</p>
                </div>
                <div className="bg-card-2 rounded-xl p-3 text-center border border-line">
                  <p className="text-xs text-muted">행운의 계절</p>
                  <p className="text-xl font-bold text-ink">{result.운세.행운요소.행운의계절}</p>
                </div>
              </div>
            </div>

            {/* 조언 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <h3 className="font-serif font-bold text-lg mb-3">{FORTUNE_YEAR.year}년 조언</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-ink">✓</span>
                  <p className="text-sm text-muted">{result.운세.조언.해야할것}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-accent">✗</span>
                  <p className="text-sm text-muted">{result.운세.조언.피해야할것}</p>
                </div>
                <div className="bg-card-2 rounded-xl p-4 text-center border border-line">
                  <p className="text-xs text-muted mb-1">명심할 말</p>
                  <p className="font-medium text-accent">"{result.운세.조언.명심할말}"</p>
                </div>
              </div>
            </div>

            <CoupangBanner subId="fortune" />

            {/* 버튼 */}
            <Link
              href={`/fortune/2027/${SLUG_BY_띠[result.사주정보.띠]}`}
              className="block w-full mb-2 py-3 text-center bg-white border border-line rounded-full font-medium"
            >
              {result.사주정보.띠}띠 {FORTUNE_YEAR.year} 운세 자세히 보기
            </Link>
            <Link
              href="/mbti/match"
              className="block w-full mb-2 py-3 text-center bg-white border border-line rounded-full font-medium"
            >
              MBTI 궁합도 보기
            </Link>
            <Link href="/face2" className="block w-full py-3 text-center bg-white border border-line rounded-full font-medium">
              내 얼굴 관상도 보기
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-muted text-xs mt-8">
          재미로만 봐 주세요. 전통 사주명리학을 참고했어요.
        </p>
      </main>
    </div>
  );
}

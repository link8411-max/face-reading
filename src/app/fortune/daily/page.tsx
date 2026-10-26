"use client";

import { useState } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import { Icon } from "@/components/icons";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";
import { sanitizeDigits, validateBirthYear } from "@/lib/birthDate";
import { 띠찾기 } from "@/lib/saju";

const 요일목록 = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
import Link from "next/link";
import { fortuneDB } from "@/lib/fortuneDB";
import { useScreenshot } from "@/hooks/useScreenshot";


export default function DailyFortunePage() {
  const goBack = useBackOrHome();
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

  const yearCheck = validateBirthYear(birthYear);

  const handleSubmit = () => {
    if (!yearCheck.ok) return;
    const year = Number(birthYear);

    // 사주의 해는 입춘(2월 4일)에 바뀐다
    const 띠 = 띠찾기(year, isEarlyYear ? 1 : 3, 1);
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
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-6">
        <TestHeader title="오늘의 운세" onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />
        {!result && (
          <div className="mt-2.5 mb-6">
            <h2 className="font-serif font-bold text-[27px] leading-[1.4] break-keep">오늘, 내 띠의<br />하루는?</h2>
            <p className="mt-2.5 text-sm text-muted">{오늘날짜}</p>
          </div>
        )}

        {/* Input Section */}
        {!result && (
          <div className="bg-white rounded-[28px] p-6 mb-6 border border-line">
            <h3 className="font-serif font-bold text-lg mb-4 text-center">태어난 해를 알려주세요</h3>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="bday-year"
              maxLength={4}
              placeholder="예: 1990"
              aria-label="태어난 해"
              value={birthYear}
              onChange={(e) => setBirthYear(sanitizeDigits(e.target.value, 4))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              aria-invalid={!!yearCheck.error}
              className="w-full px-4 py-4 bg-card-2 border border-line rounded-xl text-center text-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-line mb-2 placeholder-muted/60"
            />
            {yearCheck.error && <p role="alert" className="text-sm text-center text-accent mb-2">{yearCheck.error}</p>}
            <div className="mb-2" />

            {/* 입춘 전 출생 체크박스 */}
            <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isEarlyYear}
                onChange={(e) => setIsEarlyYear(e.target.checked)}
                className="w-5 h-5 rounded accent-accent"
              />
              <span className="text-sm text-muted">
                1월 1일~2월 3일(입춘 전)에 태어났어요
              </span>
            </label>
            <p className="text-xs text-muted text-center mb-4">
              * 띠는 입춘(2월 4일 무렵)에 바뀌어요. 그 전에 태어났다면 체크하세요
            </p>

            <button
              onClick={handleSubmit}
              disabled={!yearCheck.ok}
              className="disabled:opacity-45 w-full h-[52px] bg-ink rounded-full font-medium text-[15px] text-paper"
            >
              운세 보기
            </button>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* 캡쳐 영역 시작 */}
            <div ref={resultRef} className="space-y-3 bg-card rounded-[30px] p-4">
            {/* 기본 정보 */}
            <div className="bg-white rounded-[22px] p-5 text-center border border-line">
              <p className="text-xs font-medium text-accent">{오늘날짜}</p>
              <h2 className="font-serif text-[25px] font-bold mt-1">{result.띠}띠</h2>
              <p className="text-muted text-sm">
                {birthYear}년생 {isEarlyYear && "(입춘 전)"}
              </p>
            </div>

            {/* 오늘의 운세 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif font-bold text-lg">오늘의 운세</h3>
                <span className="text-accent text-xl tracking-wider">
                  {renderStars(result.운세.rating)}
                </span>
              </div>

              <div className="bg-card-2 rounded-xl p-4 mb-4 border border-line">
                <p className="text-xl text-center font-medium text-accent">
                  "{result.운세.한마디}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card-2 rounded-xl p-3 text-center border border-line">
                  <p className="text-xs text-muted mb-1">행운의 시간</p>
                  <p className="text-lg font-bold text-accent">{result.운세.행운시간}</p>
                </div>
                <div className="bg-card-2 rounded-xl p-3 text-center border border-line">
                  <p className="text-xs text-muted mb-1">행운의 색</p>
                  <p className="text-lg font-bold text-accent">{result.운세.행운색}</p>
                </div>
              </div>
            </div>

            {/* 띠별 특성 */}
            <div className="bg-white rounded-[22px] p-5 border border-line">
              <h3 className="font-serif font-bold text-lg mb-3">{result.띠}띠 특성</h3>
              <p className="text-muted text-sm leading-relaxed">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].성격}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {fortuneDB.띠[result.띠 as keyof typeof fortuneDB.띠].장점.map((장점, i) => (
                  <span key={i} className="px-3 py-1 bg-card-2 text-accent rounded-full text-xs border border-line">
                    {장점}
                  </span>
                ))}
              </div>
            </div>

              <div className="flex justify-between items-center px-1 text-[11px] text-muted">
                <span className="font-serif font-bold text-xs text-ink">운명을 읽다</span>
                <span>unse-ai.com</span>
              </div>
            </div>
            {/* 캡쳐 영역 끝 */}

            <div className="no-screenshot flex flex-col">
              <button onClick={() => share(getShareOptions())} disabled={isCapturing} className="h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium disabled:opacity-50">
                <Icon name="story" size={18} />
                {isCapturing ? "이미지 만드는 중…" : "오늘 운세 공유하기"}
              </button>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => download(getShareOptions())} disabled={isCapturing} className="h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Icon name="download" size={16} />
                  이미지 저장
                </button>
                <button onClick={resetAll} className="h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5">
                  <Icon name="refresh" size={16} />
                  다시하기
                </button>
              </div>
            </div>

            <CoupangBanner subId="daily" />

            <Link href="/mbti/match" className="block w-full py-3 text-center bg-white border border-line rounded-full font-medium">
              MBTI 궁합도 보기
            </Link>
            <Link href="/fortune" className="block w-full py-3 text-center bg-white border border-line rounded-full font-medium">
              {FORTUNE_YEAR.year} 신년운세 보기
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-muted text-xs mt-8">
          재미로만 봐 주세요. 과학적 근거는 없어요.
        </p>
      </main>
    </div>
  );
}

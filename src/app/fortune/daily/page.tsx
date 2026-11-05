"use client";

import SeasonPicks from "@/components/SeasonPicks";
import { track } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import CoupangBanner from "@/components/CoupangBanner";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import TestHeader from "@/components/test/TestHeader";
import { Icon } from "@/components/icons";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";
import { sanitizeDigits, validateBirthYear } from "@/lib/birthDate";
import Link from "next/link";
import { useScreenshot } from "@/hooks/useScreenshot";
import { SITE } from "@/lib/shareLinks";
import { dailyFortune, type DailyFortune, type DailyInput } from "@/lib/dailyEngine";
import { kstDate, onDayMaybeChanged } from "@/lib/kst";
import { isGanji } from "@/lib/push/validate";
import PushToggle from "@/components/fortune/PushToggle";
import DailyFortuneCard from "@/components/fortune/DailyFortuneCard";
import { dailyDateLine, dayLabel } from "@/lib/dailyEngine/format";

export default function DailyFortunePage() {
  const goBack = useBackOrHome();
  const [birthYear, setBirthYear] = useState("");
  const [isEarlyYear, setIsEarlyYear] = useState(false);
  const [result, setResult] = useState<DailyFortune | null>(null);
  const [today, setToday] = useState<string | null>(null);

  const { ref: resultRef, isCapturing, download, share, shareNotice } = useScreenshot(result);

  // 자정 갱신 콜백이 최신 결과·입력을 읽도록 ref에 둔다
  const live = useRef<{ result: DailyFortune | null; input: DailyInput | null }>({ result: null, input: null });
  // 년주(?gz=)로 들어오면 생년이 없으므로 카드의 생년 줄을 숨긴다
  const [fromGz, setFromGz] = useState(false);

  const compute = (yearText: string, early: boolean) => {
    const input: DailyInput = { kind: "년생", year: Number(yearText), isEarlyYear: early };
    const fortune = dailyFortune(input, new Date());
    live.current = { result: fortune, input };
    setResult(fortune);
    track("fortune_submit", { test_name: "daily" });
    track("result_view", { test_name: "daily", result_id: fortune.나.띠 });
  };

  useEffect(() => {
    const update = () => {
      const now = kstDate(new Date());
      setToday(now);
      // 결과를 연 채로 자정을 넘기면 오늘 날짜로 다시 계산한다(GA는 다시 보내지 않는다)
      const cur = live.current;
      if (cur.result && cur.input && cur.result.날짜 !== now) {
        const fresh = dailyFortune(cur.input, new Date());
        live.current = { ...cur, result: fresh };
        setResult(fresh);
      }
    };
    update();
    const off = onDayMaybeChanged(update);
    // 주소의 ?year=&early=1 로 입력을 채우고 바로 보여 준다. 읽은 뒤 주소에서 지운다
    const q = new URLSearchParams(location.search);
    const y = q.get("year");
    if (y && /^\d{4}$/.test(y)) {
      const early = q.get("early") === "1";
      setBirthYear(y);
      setIsEarlyYear(early);
      if (validateBirthYear(y).ok) compute(y, early);
    }
    const gz = q.get("gz");
    if (!(y && /^\d{4}$/.test(y)) && gz && isGanji(gz)) {
      // 푸시 링크: 년주(천간+지지)로 바로 보여 준다. 엔진이 모르는 글자면 입력 화면 그대로 둔다
      try {
        const input: DailyInput = { kind: '년주', 천간: gz[0], 지지: gz[1] };
        const fortune = dailyFortune(input, new Date());
        live.current = { result: fortune, input };
        setFromGz(true);
        setResult(fortune);
        track("result_view", { test_name: "daily", result_id: fortune.나.띠 });
        if (q.get("utm_source") === "push") track("shared_landing", { test_name: "daily", result_id: "push" });
      } catch {
        /* 잘못된 gz는 무시 */
      }
    }
    if (q.has("year") || q.has("early") || q.has("gz")) {
      q.delete("gz");
      q.delete("year");
      q.delete("early");
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q.toString() : "") + location.hash);
    }
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const 날짜줄 = result ? dailyDateLine(result) : "";

  const getShareOptions = () => ({
    fileName: `오늘의운세_${result?.나.띠}띠`,
    shareTitle: `오늘의 ${result?.나.띠}띠 운세`,
    shareText: `${날짜줄} - ${result?.한마디}`,
    testName: "daily" as const,
    // 카카오톡 카드는 출생 연도 없이 오늘의 운세 페이지로 보낸다
    kakao: result ? {
      title: `오늘의 ${result.나.띠}띠 운세`,
      text: `오늘 ${result.나.년주표기}년 ${result.나.띠}띠 운세는 '${result.한마디}'래. 너도 봐줄까?`,
      url: `${SITE}/fortune/daily?utm_source=share&utm_medium=friend_link&utm_campaign=daily`,
      imageUrl: `${SITE}/api/og?title=${encodeURIComponent("오늘의 운세")}&subtitle=${encodeURIComponent(`${날짜줄} ${result.나.띠}띠 운세`)}`,
    } : undefined,
  });

  const yearCheck = validateBirthYear(birthYear);

  const handleSubmit = () => {
    if (!yearCheck.ok) return;
    compute(birthYear, isEarlyYear);
  };

  const resetAll = () => {
    live.current = { result: null, input: null };
    setFromGz(false);
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
            <p className="mt-2.5 text-sm text-muted">{today ? dayLabel(today) : "\u00A0"}</p>
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
            <DailyFortuneCard fortune={result} birthYearLabel={fromGz ? null : `${birthYear}년생${isEarlyYear ? " (입춘 전)" : ""}`} />
            </div>
            {/* 캡쳐 영역 끝 */}

            <div className="no-screenshot flex flex-col">
              <button onClick={() => share(getShareOptions())} disabled={isCapturing} className="h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium disabled:opacity-50">
                <Icon name="share" size={18} />
                {isCapturing ? "이미지 만드는 중…" : "오늘 운세 공유하기"}
              </button>
              {shareNotice && <p role="status" className="mt-2 text-xs text-center text-muted">{shareNotice}</p>}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => { track("share_click", { test_name: "daily", method: "save_image" }); download(getShareOptions()); }} disabled={isCapturing} className="h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Icon name="download" size={16} />
                  이미지 저장
                </button>
                <button onClick={resetAll} className="h-12 rounded-full bg-white border border-line text-sm font-medium flex items-center justify-center gap-1.5">
                  <Icon name="refresh" size={16} />
                  다시하기
                </button>
              </div>
              <PushToggle fortune={result} />
            </div>

            <SeasonPicks slot="daily" />
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

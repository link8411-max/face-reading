"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import { useRememberedGender } from "@/hooks/useRememberedGender";
import { useScreenshot } from "@/hooks/useScreenshot";
import { useResultShare } from "@/hooks/useResultShare";
import TestHeader from "@/components/test/TestHeader";
import GenderPills from "@/components/test/GenderPills";
import BirthDateFields from "@/components/BirthDateFields";
import ResultActions from "@/components/result/ResultActions";
import NextSteps from "@/components/result/NextSteps";
import CoupangBanner from "@/components/CoupangBanner";
import SajuResultView from "@/components/saju/SajuResultView";
import { validateBirthDate } from "@/lib/birthDate";
import { HOUR_SLOTS, isHourSlotKey } from "@/lib/saju/keys";
import type { SajuResult } from "@/lib/saju/engine";
import { DAY_MASTER_COPY } from "@/content/saju";
import { ogImageUrl, parseShared, shareUrl } from "@/lib/shareLinks";

const FAIL_TEXT: Record<string, string> = {
  range: "1900년부터 올해까지의 날짜만 계산할 수 있어요. 음력은 2100년까지 볼 수 있어요.",
  invalid: "날짜를 다시 확인해 주세요. 음력 윤달은 그 해에 있는 달만 고를 수 있어요.",
};

export default function SajuClient() {
  const goBack = useBackOrHome();
  const [birthDate, setBirthDate] = useState({ year: "", month: "", day: "" });
  const [hourSlot, setHourSlot] = useState("");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [gender, chooseGender] = useRememberedGender();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SajuResult | null>(null);
  const [birthLine, setBirthLine] = useState("");

  const dateCheck = validateBirthDate(birthDate, new Date(), { lunar: isLunar });
  const canSubmit = dateCheck.ok && !!gender && !loading;

  const { ref: resultRef, isCapturing, download } = useScreenshot<HTMLElement>(result);
  const dayKey = result?.dayMaster.key;
  const { busy, notice, share } = useResultShare(
    dayKey
      ? {
          testName: "saju",
          title: "운명을 읽다 · 내 사주 풀이",
          text: parseShared("saju", dayKey)!.phrase,
          url: shareUrl("saju", dayKey),
          imageUrl: ogImageUrl("saju", dayKey),
        }
      : null,
  );

  const handleSubmit = async () => {
    if (!canSubmit || !gender) return;
    setLoading(true);
    setError(null);
    track("fortune_submit", { test_name: "saju" });
    try {
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(birthDate.year),
          month: parseInt(birthDate.month),
          day: parseInt(birthDate.day),
          hourSlot: isHourSlotKey(hourSlot) ? hourSlot : null,
          isLunar,
          isLeapMonth: isLunar && isLeapMonth,
          gender,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(FAIL_TEXT[data.reason] ?? FAIL_TEXT.invalid);
        return;
      }
      const r = data as SajuResult;
      const base = `${birthDate.year}년 ${birthDate.month}월 ${birthDate.day}일생 · ${isLunar ? (isLeapMonth ? "음력 윤달" : "음력") : "양력"}`;
      setBirthLine(isLunar ? `${base} (양력 ${r.solar.year}.${r.solar.month}.${r.solar.day})` : base);
      setResult(r);
      track("result_view", { test_name: "saju", result_id: r.dayMaster.key });
    } catch {
      setError("사주를 계산하다 문제가 생겼어요. 잠시 뒤에 다시 해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setBirthDate({ year: "", month: "", day: "" });
    setHourSlot("");
    setIsLunar(false);
    setIsLeapMonth(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto px-[22px] max-w-lg pb-6">
        <TestHeader title="내 사주 풀이" onBack={() => (result ? resetAll() : goBack())} backLabel={result ? "다시하기" : "돌아가기"} />

        {!result && (
          <>
            <div className="mt-2.5 mb-6">
              <h2 className="font-serif font-bold text-[27px] leading-[1.4] break-keep">생년월일시로 읽는<br />내 사주 풀이</h2>
              <p className="mt-2.5 text-sm text-muted">타고난 성향과 10년 흐름, 올해를 쉬운 말로 풀어 드려요</p>
            </div>
            <div className="bg-white rounded-[28px] p-6 mb-6 border border-line">
              <div className="flex justify-center gap-2 mb-4">
                {[false, true].map((lunar) => (
                  <button
                    key={String(lunar)}
                    type="button"
                    onClick={() => setIsLunar(lunar)}
                    aria-pressed={isLunar === lunar}
                    className={`h-11 px-5 rounded-full text-sm font-medium border transition ${isLunar === lunar ? "bg-ink text-paper border-ink" : "bg-white text-ink border-line"}`}
                  >
                    {lunar ? "음력" : "양력"}
                  </button>
                ))}
              </div>
              {isLunar && (
                <div className="mb-4 text-center">
                  <label className="inline-flex items-center gap-2 text-sm text-muted cursor-pointer">
                    <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} className="w-4 h-4 accent-accent" />
                    윤달이에요
                  </label>
                </div>
              )}

              <BirthDateFields value={birthDate} onChange={setBirthDate} error={dateCheck.error} />

              <div className="mb-4">
                <label htmlFor="saju-hour" className="block text-sm text-muted mb-1">태어난 시간</label>
                <select
                  id="saju-hour"
                  value={hourSlot}
                  onChange={(e) => setHourSlot(e.target.value)}
                  className="w-full px-4 py-3 bg-card-2 border border-line rounded-xl text-center text-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 appearance-none cursor-pointer"
                >
                  <option value="">모름</option>
                  {HOUR_SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1 text-center">모르면 &apos;모름&apos;을 골라요. 시주 없이 세 기둥으로 풀어요.</p>
              </div>

              <div className="mb-6">
                <p className="block text-sm text-muted mb-1">성별 (10년 흐름의 방향을 정하는 데 써요)</p>
                <GenderPills value={gender} onChange={chooseGender} />
              </div>

              {error && <p role="alert" className="mb-3 text-sm text-accent text-center">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full h-[52px] bg-ink rounded-full font-medium text-[15px] disabled:opacity-45 text-paper"
              >
                {loading ? "사주를 계산하는 중…" : "내 사주 보기"}
              </button>
              <p className="mt-3 text-xs text-muted text-center">입력한 생년월일은 저장하지 않아요</p>
            </div>
          </>
        )}

        {result && (
          <SajuResultView
            result={result}
            captureRef={resultRef}
            birthLine={birthLine}
            actions={
              <ResultActions
                onShare={share}
                onSave={() => {
                  track("share_click", { test_name: "saju", method: "save_image" });
                  download({ fileName: `사주_${DAY_MASTER_COPY[result.dayMaster.stem].title}` });
                }}
                onRetry={resetAll}
                busy={busy || isCapturing}
                notice={notice}
              />
            }
            after={
              <>
                <div className="mt-2"><CoupangBanner subId="saju" /></div>
                <NextSteps from="saju" />
              </>
            }
          />
        )}
      </main>
    </div>
  );
}

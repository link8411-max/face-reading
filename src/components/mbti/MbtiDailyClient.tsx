"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TestHeader from "@/components/test/TestHeader";
import ResultActions from "@/components/result/ResultActions";
import SeasonPicks from "@/components/SeasonPicks";
import { TypeGroup } from "@/components/mbti/MatchCalculator";
import MbtiDailyCard, { dateLabel } from "@/components/mbti/MbtiDailyCard";
import { useBackOrHome } from "@/hooks/useBackOrHome";
import { useResultShare } from "@/hooks/useResultShare";
import { useScreenshot } from "@/hooks/useScreenshot";
import { track } from "@/lib/analytics";
import { kstDate, mbtiDaily } from "@/lib/mbti/daily";
import { loadMbti, saveMbti } from "@/lib/mbtiMemory";
import { mbtiDailyPhrase, mbtiDailyUrl, parseMbtiDailyKey, SITE } from "@/lib/shareLinks";
import { mbtiProfiles } from "@/content/mbtiTypes";
import type { MbtiType } from "@/lib/mbti/compat";

// 오늘의 MBTI 운세: 유형을 고르면 오늘(한국 시간) 운세. 날짜는 브라우저에서 계산한다(정적 HTML·캐시의 어제 날짜 방지).
// ?t=infp 로 들어오면 그 유형을 바로 열고, 고른 유형은 이 기기에 기억해 다음에 바로 보여 준다.
export default function MbtiDailyClient() {
  const goBack = useBackOrHome();
  const [date, setDate] = useState<string | null>(null);
  const [type, setType] = useState<MbtiType | null>(null);
  const { ref, isCapturing, download } = useScreenshot<HTMLElement>();

  useEffect(() => {
    setDate(kstDate(new Date()));
    const fromLink = parseMbtiDailyKey(new URLSearchParams(window.location.search).get("t") ?? "");
    if (fromLink) saveMbti(fromLink);
    const t = fromLink ?? loadMbti();
    if (t) setType(t);
  }, []);

  const daily = useMemo(() => (type && date ? mbtiDaily(type, date) : null), [type, date]);

  useEffect(() => {
    if (type && date) track("result_view", { test_name: "mbti_daily", result_id: type });
  }, [type, date]);

  const share = useResultShare(type && daily ? {
    testName: "mbti_daily",
    title: "운명을 읽다 · 오늘의 MBTI 운세",
    text: mbtiDailyPhrase(type, daily.headline),
    url: mbtiDailyUrl(type),
    imageUrl: `${SITE}/api/og/result?kind=mbti-daily&type=${type.toLowerCase()}`,
  } : null);

  const choose = (t: MbtiType) => {
    saveMbti(t);
    setType(t);
    window.scrollTo({ top: 0 });
  };
  const reset = () => {
    setType(null);
    if (window.location.search) window.history.replaceState(null, "", "/fortune/mbti");
  };

  return (
    <main className="mx-auto px-[22px] max-w-lg">
      <TestHeader title="오늘의 MBTI 운세" onBack={() => (type ? reset() : goBack())} backLabel={type ? "다시하기" : "돌아가기"} />
      {type && daily && date ? (
        <div className="pb-6">
          <MbtiDailyCard type={type} date={date} daily={daily} captureRef={ref} />
          <ResultActions
            onShare={share.share}
            onSave={() => { track("share_click", { test_name: "mbti_daily", method: "save_image" }); download({ fileName: `오늘의MBTI운세_${type}` }); }}
            onRetry={reset}
            retryLabel="다른 유형 보기"
            busy={share.busy || isCapturing}
            notice={share.notice}
          />
          <div className="grid grid-cols-2 gap-2 mt-5 text-sm no-screenshot">
            <Link href={`/mbti/${type.toLowerCase()}`} className="text-center py-3 rounded-[18px] bg-card-2 font-bold">{type} {mbtiProfiles[type].nickname}</Link>
            <Link href="/fortune/daily" className="text-center py-3 rounded-[18px] bg-card-2 font-bold">띠로 보는 오늘의 운세</Link>
          </div>
          <div className="mt-5">
            <SeasonPicks slot="mbti_daily" />
          </div>
        </div>
      ) : (
        <div className="pb-7 no-screenshot">
          <h2 className="mt-2.5 font-serif font-bold text-[27px] leading-[1.4] break-keep">MBTI만 고르면<br />오늘 운세가 나와요</h2>
          <p className="mt-2.5 text-sm text-muted leading-relaxed">{date ? dateLabel(date) : "오늘"} · 생년월일 없이 볼 수 있어요.</p>
          <div className="mt-6">
            <TypeGroup label="내 MBTI" value={null} onChange={choose} />
          </div>
          <p className="mt-5 text-xs text-muted text-center">
            내 MBTI를 모른다면 <Link href="/mbti" className="underline underline-offset-2 text-ink">16유형 풀이</Link>에서 골라 보세요
          </p>
        </div>
      )}
    </main>
  );
}

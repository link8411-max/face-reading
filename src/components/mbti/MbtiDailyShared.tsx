"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MbtiDailyCard from "@/components/mbti/MbtiDailyCard";
import { kstDate, mbtiDaily } from "@/lib/mbti/daily";
import { loadMbti } from "@/lib/mbtiMemory";
import type { MbtiType } from "@/lib/mbti/compat";

// 친구가 보낸 오늘의 MBTI 운세: 연 날의 오늘 운세를 보여 준다(링크에 날짜 없음, 날짜는 브라우저에서 계산).
// "내 MBTI로 보기"는 기억한 내 유형이 있으면 그 결과로 바로 간다.
export default function MbtiDailyShared({ type }: { type: MbtiType }) {
  const [date, setDate] = useState<string | null>(null);
  const [mine, setMine] = useState<MbtiType | null>(null);
  useEffect(() => {
    setDate(kstDate(new Date()));
    setMine(loadMbti());
  }, []);
  return (
    <>
      <p className="text-sm text-muted mb-3">친구가 보낸 오늘의 운세</p>
      {date ? <MbtiDailyCard type={type} date={date} daily={mbtiDaily(type, date)} withMatchLink={false} /> : <div className="h-[420px] rounded-[30px] bg-card" aria-hidden />}
      <Link href={mine ? `/fortune/mbti?t=${mine.toLowerCase()}` : "/fortune/mbti"} className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-ink text-paper text-base font-medium">내 MBTI로 보기</Link>
      <p className="mt-3 text-xs text-center text-muted">생년월일 없이 MBTI만 고르면 돼요</p>
    </>
  );
}

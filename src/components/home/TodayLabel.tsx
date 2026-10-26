"use client";

import { useEffect, useState } from "react";

// 오늘 날짜(한국 시간). 서버·브라우저 날짜가 달라 생기는 hydration 오류를 막으려고 마운트 뒤에 계산한다.
export default function TodayLabel({ suffix }: { suffix: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const parts = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    setLabel(`${get("month")}월 ${get("day")}일 · `);
  }, []);
  return <>{label}{suffix}</>;
}

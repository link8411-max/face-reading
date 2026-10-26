"use client";

import { useEffect, useState } from "react";

// 이달의 운세: 정적 페이지라 빌드한 달 기준으로 렌더된다. 방문 시점이 다른 달이면 브라우저에서 숨긴다.
export default function MonthlyFortune({ month, text, lucky, visibleAtBuild }: { month: string; text: string; lucky: string; visibleAtBuild: boolean }) {
  const [visible, setVisible] = useState(visibleAtBuild);
  useEffect(() => {
    const d = new Date();
    setVisible(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === month);
  }, [month]);
  if (!visible) return null;
  const [y, m] = month.split("-");
  return (
    <section className="bg-white border border-line rounded-3xl p-5">
      <h2 className="font-black text-lg text-vermilion mb-2">{y}년 {Number(m)}월의 운세</h2>
      <p className="leading-relaxed">{text}</p>
      <p className="text-sm text-muted mt-2">🍀 {lucky}</p>
    </section>
  );
}

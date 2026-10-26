"use client";

import { useEffect, useState } from "react";
import { seoulMonth } from "@/content/mbtiTypes";

// 이달의 운세: 페이지는 하루마다 다시 만들어져(revalidate) 서버 HTML이 그 달 기준이 된다. 그 사이 달이 바뀌면 브라우저에서 숨긴다.
export default function MonthlyFortune({ month, text, lucky, visibleAtBuild }: { month: string; text: string; lucky: string; visibleAtBuild: boolean }) {
  const [visible, setVisible] = useState(visibleAtBuild);
  useEffect(() => {
    setVisible(seoulMonth(new Date()) === month);
  }, [month]);
  if (!visible) return null;
  const [y, m] = month.split("-");
  return (
    <section className="bg-white border border-line rounded-3xl p-5">
      <h2 className="font-bold text-lg text-accent mb-2">{y}년 {Number(m)}월의 운세</h2>
      <p className="leading-relaxed">{text}</p>
      <p className="text-sm text-muted mt-2">행운 · {lucky}</p>
    </section>
  );
}

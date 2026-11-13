"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// 가로 스냅 줄 + 현재 장 표시(1 / N)와 점. 자동으로 넘기지 않는다.
export default function HeroScroller({ total, children }: { total: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCur(Number((e.target as HTMLElement).dataset.index ?? 0));
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-hero-slide]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div>
      <div className="relative">
        <div ref={ref} data-hero-scroller className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] rounded-[24px] border border-line">
          {children}
        </div>
        <span data-hero-count className="pointer-events-none absolute top-3.5 left-3.5 px-3 py-[5px] rounded-full bg-paper/70 border border-line text-xs text-ink">{cur + 1} / {total}</span>
      </div>
      <div className="flex justify-center gap-1.5 pt-3" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 rounded-[3px] transition-all ${i === cur ? "w-[18px] bg-ink" : "w-1.5 bg-line"}`} />
        ))}
      </div>
    </div>
  );
}

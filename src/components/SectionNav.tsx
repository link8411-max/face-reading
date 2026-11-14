"use client";
// 긴 상세 페이지의 따라다니는 단락 탭(11/14 사용자: "따라다니면서 스크롤로 이동시켜 주는 탭").
// 화면 위에 붙어(sticky) 따라오고, 누르면 그 단락으로 부드럽게 이동, 스크롤하면 지금 보는 단락 탭이 켜진다.
// 항목은 서버에서 넘겨 HTML에 그대로 있다(검색 봇·첫 화면에 탭이 바로 보이게, 레이아웃 밀림 없음). 단락 요소에는 같은 id와 scroll-mt-14를 단다.
import { useEffect, useRef, useState } from "react";

export interface SectionItem { id: string; label: string }

const BAR = 52; // 탭 줄 높이(px). 이 아래부터 단락이 보이게 이동한다

// edge: 바깥 여백을 뚫는 클래스(페이지 좌우 여백과 같게)
export default function SectionNav({ items, className = "", edge = "-mx-4 px-4", label = "단락 바로 가기" }: { items: SectionItem[]; className?: string; edge?: string; label?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const strip = useRef<HTMLDivElement>(null);
  const lock = useRef(0); // 탭을 눌러 이동하는 동안은 스크롤로 켜진 탭을 바꾸지 않는다

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (Date.now() < lock.current) return;
        let cur = items[0]?.id;
        for (const it of items) {
          const el = document.getElementById(it.id);
          if (el && el.getBoundingClientRect().top <= BAR + 24) cur = it.id;
        }
        // 맨 아래까지 내렸으면 마지막 단락
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = items[items.length - 1]?.id;
        setActive(cur);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [items]);

  // 켜진 탭이 가로 줄에서 보이게(세로 스크롤은 건드리지 않는다)
  useEffect(() => {
    const s = strip.current;
    const b = s?.querySelector<HTMLElement>(`[data-section-tab="${active}"]`);
    if (!s || !b) return;
    const left = b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2;
    s.scrollTo?.({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    const target = () => el.getBoundingClientRect().top + window.scrollY - BAR - 8;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lock.current = Date.now() + 1100;
    window.scrollTo({ top: target(), behavior: reduce ? "auto" : "smooth" });
    // 내려가는 동안 그림이 불러와지며 위쪽 높이가 바뀌면 덜 가거나 더 간다(관우 열전에서 50px). 끝난 뒤 한 번 더 맞춘다
    window.setTimeout(() => {
      if (Math.abs(el.getBoundingClientRect().top - (BAR + 8)) > 4) window.scrollTo({ top: target(), behavior: "auto" });
    }, 900);
  };

  return (
    <nav aria-label={label} className={`no-screenshot sticky top-0 z-30 ${edge} bg-paper/95 backdrop-blur border-b border-line ${className}`} data-section-nav>
      <div ref={strip} className="flex gap-1.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <a
              key={it.id}
              href={`#${it.id}`}
              data-section-tab={it.id}
              aria-current={on ? "true" : undefined}
              onClick={(e) => { e.preventDefault(); go(it.id); }}
              className={`flex-none h-9 px-3.5 rounded-full text-[13px] font-medium grid place-items-center whitespace-nowrap ${on ? "bg-ink text-paper" : "text-muted bg-card border border-line"}`}
            >
              {it.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

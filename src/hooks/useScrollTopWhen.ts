"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * 결과 화면이 열리거나(또는 다시하기로 닫히면) 화면이 그려진 직후 맨 위(0)로 즉시 올린다.
 * 상태를 바꾸는 손잡이 안에서 smooth 스크롤을 걸면 결과가 그려지며 높이가 바뀌어 중간에 멈춘다(11/14 사용자 제보).
 * 첫 렌더(페이지 진입)에는 움직이지 않는다.
 */
export function scrollToTopNow() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
}

export function useScrollTopWhen(trigger: unknown) {
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    scrollToTopNow();
  }, [trigger]);
}

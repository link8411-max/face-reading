"use client";

import { useCallback, useEffect, useState } from "react";
import type { Gender } from "@/components/test/GenderPills";
import { loadGender, saveGender } from "@/lib/genderMemory";

// 내 성별: 처음엔 비어 있다가(서버 HTML과 맞춤) 화면이 뜨면 기억한 값을 채운다. 고르면 기억한다.
export function useRememberedGender(): [Gender | null, (g: Gender) => void] {
  const [gender, setGender] = useState<Gender | null>(null);
  useEffect(() => {
    const g = loadGender();
    if (g) setGender((cur) => cur ?? g);
  }, []);
  const choose = useCallback((g: Gender) => {
    setGender(g);
    saveGender(g);
  }, []);
  return [gender, choose];
}

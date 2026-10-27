"use client";

import { useEffect, useRef } from "react";
import { takeHandedPhoto } from "@/lib/photoHandoff";

// 다른 사진 테스트 결과에서 "같은 사진으로 바로 보기"로 넘어오면 그 사진을 채우고,
// 분석할 준비(성별·모델·사진 표시)가 되면 한 번 바로 분석한다.
export function useHandedPhoto(setImage: (image: string) => void, ready: boolean, run: () => void) {
  const pending = useRef(false);
  useEffect(() => {
    const image = takeHandedPhoto();
    if (image) {
      pending.current = true;
      setImage(image);
    }
  }, [setImage]);
  useEffect(() => {
    if (pending.current && ready) {
      pending.current = false;
      run();
    }
  }, [ready, run]);
}

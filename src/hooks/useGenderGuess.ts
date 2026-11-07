"use client";

import { useEffect, useRef } from "react";
import type { Gender } from "@/lib/face/featureStats";
import { guessGender } from "@/lib/face/genderGuess";

async function guessFromSrc(src: string): Promise<Gender | null> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return await guessGender(img);
  } catch {
    return null;
  }
}

// 사진이 새로 올라왔고 성별이 비어 있을 때만 한 번 추정해 채운다. 그 사이 사용자가 고른 값은 덮어쓰지 않는다.
export function useGenderGuess(
  image: string | null,
  current: Gender | null,
  setGender: (g: Gender) => void,
  guess: (src: string) => Promise<Gender | null> = guessFromSrc,
): void {
  const latest = useRef(current);
  latest.current = current;
  const setRef = useRef(setGender);
  setRef.current = setGender;
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!image || done.current === image) return;
    if (latest.current !== null) return;
    done.current = image;
    guess(image)
      .then((g) => {
        if (done.current !== image || !g || latest.current !== null) return;
        setRef.current(g);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);
}

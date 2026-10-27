"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { saveImage } from "@/lib/saveImage";
import { shareResult, SHARE_NOTICE } from "@/lib/share";
import { captureFilter } from "@/lib/capture";

interface UseScreenshotOptions {
  fileName?: string;
  shareTitle?: string;
  shareText?: string;
}

// prepareFor: 결과가 바뀔 때마다(값이 있으면) 공유용 이미지를 미리 만들어 둔다.
// 공유창은 누른 직후에 열어야 한다(이미지를 그 자리에서 만들면 1~3초 걸려 브라우저가 공유를 거절할 수 있음).
export function useScreenshot<T extends HTMLElement = HTMLDivElement>(prepareFor?: unknown) {
  const ref = useRef<T>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const ready = useRef<Blob | null>(null);

  const capture = useCallback(async (silent = false): Promise<Blob | null> => {
    if (!ref.current) {
      if (!silent) alert("캡쳐할 영역을 찾을 수 없습니다.");
      return null;
    }

    // 모바일 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      const { domToBlob } = await import("modern-screenshot");

      // 타임아웃 설정 (15초)
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("캡쳐 시간 초과")), 15000)
      );

      const capturePromise = domToBlob(ref.current, {
        // 배경색을 주지 않는다: 캡처 대상(결과 카드)이 자기 배경을 가지고 있고, 지정하면 카드 배경을 덮어쓴다
        scale: isMobile ? 1.5 : 2, // 모바일은 낮은 해상도
        filter: captureFilter, // 쿠팡 배너 iframe·no-screenshot(생년월일 등) 제외
      });

      const blob = await Promise.race([capturePromise, timeoutPromise]);
      return blob;
    } catch (error) {
      console.error("캡쳐 실패:", error);
      if (!silent) alert("이미지 캡쳐에 실패했습니다: " + (error as Error).message);
      return null;
    }
  }, []);

  const download = useCallback(async (options?: UseScreenshotOptions) => {
    setIsCapturing(true);
    const blob = await capture();
    setIsCapturing(false);

    if (!blob) {
      alert("이미지 생성에 실패했습니다.");
      return;
    }

    saveImage(blob, options?.fileName || "결과");
  }, [capture]);

  // 결과가 나오면 등장 애니메이션(0.5초)이 끝난 뒤 공유용 이미지를 미리 만든다
  useEffect(() => {
    ready.current = null;
    if (!prepareFor) return;
    let alive = true;
    const t = setTimeout(async () => {
      const blob = await capture(true);
      if (alive) ready.current = blob;
    }, 800);
    return () => { alive = false; clearTimeout(t); };
  }, [prepareFor, capture]);

  // 공유하기: 기본 공유창(이미지+문구+주소) → 링크만 → 링크 복사 (lib/share.ts)
  // 누른 순간 바로 공유창을 연다. 미리 만든 이미지가 아직 없으면 링크·문구만 보낸다.
  const share = useCallback(async (options?: UseScreenshotOptions) => {
    setShareNotice(null);
    const blob = ready.current;
    const file = blob ? new File([blob], `${options?.fileName || "결과"}.png`, { type: "image/png" }) : null;
    const out = await shareResult({
      file,
      title: options?.shareTitle || "운명을 읽다",
      text: options?.shareText || "",
      url: location.href.split("#")[0],
    });
    if (out === "copied") setShareNotice(SHARE_NOTICE.copied);
    if (out === "failed") setShareNotice(SHARE_NOTICE.failed);
  }, []);

  return {
    ref,
    isCapturing,
    shareNotice,
    download,
    share,
  };
}

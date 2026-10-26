"use client";

import { useRef, useState, useCallback } from "react";
import { saveImage } from "@/lib/saveImage";
import { shareResult, SHARE_NOTICE } from "@/lib/share";

interface UseScreenshotOptions {
  fileName?: string;
  shareTitle?: string;
  shareText?: string;
}

export function useScreenshot<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) {
      alert("캡쳐할 영역을 찾을 수 없습니다.");
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
        filter: (node) => {
          // iframe 제외 (쿠팡 배너 등)
          if (node instanceof HTMLIFrameElement) return false;
          return true;
        },
      });

      const blob = await Promise.race([capturePromise, timeoutPromise]);
      return blob;
    } catch (error) {
      console.error("캡쳐 실패:", error);
      alert("이미지 캡쳐에 실패했습니다: " + (error as Error).message);
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

  // 공유하기: 기본 공유창(이미지+문구+주소) → 링크만 → 링크 복사 (lib/share.ts)
  const share = useCallback(async (options?: UseScreenshotOptions) => {
    setShareNotice(null);
    setIsCapturing(true);
    const blob = await capture();
    setIsCapturing(false);
    const file = blob ? new File([blob], `${options?.fileName || "결과"}.png`, { type: "image/png" }) : null;
    const out = await shareResult({
      file,
      title: options?.shareTitle || "운명을 읽다",
      text: options?.shareText || "",
      url: location.href.split("#")[0],
    });
    if (out === "copied") setShareNotice(SHARE_NOTICE.copied);
    if (out === "failed") setShareNotice(SHARE_NOTICE.failed);
  }, [capture]);

  return {
    ref,
    isCapturing,
    shareNotice,
    download,
    share,
  };
}

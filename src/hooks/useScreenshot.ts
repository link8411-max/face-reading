"use client";

import { useRef, useState, useCallback } from "react";

interface UseScreenshotOptions {
  fileName?: string;
  shareTitle?: string;
  shareText?: string;
}

export function useScreenshot<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async (): Promise<Blob | null> => {
    if (!ref.current) {
      alert("캡쳐할 영역을 찾을 수 없습니다.");
      return null;
    }

    try {
      const { domToBlob } = await import("modern-screenshot");
      const blob = await domToBlob(ref.current, {
        backgroundColor: "#1c1917",
        scale: 2,
      });
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

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${options?.fileName || "결과"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("이미지 생성에 실패했습니다.");
    }
  }, [capture]);

  const share = useCallback(async (options?: UseScreenshotOptions) => {
    setIsCapturing(true);
    const blob = await capture();
    setIsCapturing(false);

    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `${options?.fileName || "결과"}.png`, { type: "image/png" });

      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: options?.shareTitle || "결과 공유",
            text: options?.shareText || "",
            files: [file],
          });
          return;
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("공유 실패:", error);
          }
          return;
        }
      }
    }

    // Web Share API 미지원시 다운로드로 대체
    await download(options);
  }, [capture, download]);

  return {
    ref,
    isCapturing,
    download,
    share,
  };
}

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

    // 모바일 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
      const { domToBlob } = await import("modern-screenshot");

      // 타임아웃 설정 (15초)
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("캡쳐 시간 초과")), 15000)
      );

      const capturePromise = domToBlob(ref.current, {
        backgroundColor: "#1c1917",
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

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      // iOS: 모달로 이미지 표시 (길게 눌러서 저장)
      const url = URL.createObjectURL(blob);
      const modal = document.createElement("div");
      modal.id = "ios-save-modal";
      modal.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;";
      modal.innerHTML = `
        <p style="color:#fff;margin-bottom:15px;font-size:16px;">👆 이미지를 길게 눌러 저장하세요</p>
        <img src="${url}" style="max-width:100%;max-height:70vh;border-radius:8px;" />
        <button id="ios-modal-close" style="margin-top:20px;padding:12px 30px;background:#f59e0b;color:#000;border:none;border-radius:8px;font-size:16px;font-weight:bold;">닫기</button>
      `;
      document.body.appendChild(modal);
      document.getElementById("ios-modal-close")?.addEventListener("click", () => {
        URL.revokeObjectURL(url);
        modal.remove();
      });
    } else {
      // Android/PC: 일반 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${options?.fileName || "결과"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

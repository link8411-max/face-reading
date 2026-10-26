"use client";

import { useCallback, useRef, useState } from "react";
import { shareOrSave, STORY_MODAL_NOTICE, STORY_SAVED_NOTICE } from "@/lib/storyShare";
import { saveImage, type SaveMethod } from "@/lib/saveImage";

// 9:16 스토리 이미지(1080×1920)를 만들어 공유하거나 저장한다. frameRef는 <StoryFrame>에 붙인다.
export function useStoryShare() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const shareStory = useCallback(async (fileName: string) => {
    if (!frameRef.current) return;
    setBusy(true);
    setNotice(null);
    try {
      const { domToBlob } = await import("modern-screenshot");
      const blob = await domToBlob(frameRef.current, {
        backgroundColor: "#FBF6F1",
        scale: 3,
        filter: (node) => !(node instanceof HTMLIFrameElement),
      });
      if (!blob) throw new Error("이미지를 만들지 못했어요");
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      const saved: { method: SaveMethod | null } = { method: null };
      const outcome = await shareOrSave(file, (f) => { saved.method = saveImage(f, f.name); });
      if (outcome === "saved") setNotice(saved.method === "modal" ? STORY_MODAL_NOTICE : STORY_SAVED_NOTICE);
    } catch (e) {
      console.error("스토리 이미지 실패:", e);
      setNotice("이미지를 만들지 못했어요. 이미지 저장을 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { frameRef, busy, notice, shareStory };
}

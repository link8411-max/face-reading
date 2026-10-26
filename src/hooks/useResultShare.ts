"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { captureBlob } from "@/lib/capture";
import { shareResult, SHARE_NOTICE } from "@/lib/share";

export interface ShareMeta { fileName: string; title: string; text: string }

// 결과 공유하기: 결과가 나오면 카드 이미지를 미리 만들어 둔다.
// 누른 뒤에 이미지를 만들면 시간이 걸려 iOS가 공유창을 거절할 수 있다(사용자 동작 시간 만료).
export function useResultShare(targetRef: RefObject<HTMLElement | null>, meta: ShareMeta | null) {
  const fileRef = useRef<Promise<File | null> | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const makeFile = useCallback(async (m: ShareMeta): Promise<File | null> => {
    if (!targetRef.current) return null;
    try {
      const blob = await captureBlob(targetRef.current);
      return blob ? new File([blob], `${m.fileName}.png`, { type: "image/png" }) : null;
    } catch (e) {
      console.error("공유 이미지 실패:", e);
      return null;
    }
  }, [targetRef]);

  const key = meta ? `${meta.fileName}|${meta.text}` : "";
  useEffect(() => {
    fileRef.current = null;
    setNotice(null);
    if (!meta) return;
    const t = setTimeout(() => { fileRef.current = makeFile(meta); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, makeFile]);

  const share = useCallback(async () => {
    if (!meta) return;
    setBusy(true);
    setNotice(null);
    try {
      const file = await (fileRef.current ?? (fileRef.current = makeFile(meta)));
      const out = await shareResult({ file, title: meta.title, text: meta.text, url: location.href.split("#")[0] });
      if (out === "copied") setNotice(SHARE_NOTICE.copied);
      if (out === "failed") setNotice(SHARE_NOTICE.failed);
    } finally {
      setBusy(false);
    }
  }, [meta, makeFile]);

  return { busy, notice, share };
}

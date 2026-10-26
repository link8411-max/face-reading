"use client";

import { useCallback, useEffect, useState } from "react";
import { shareResult, SHARE_NOTICE } from "@/lib/share";

export interface ShareMeta { title: string; text: string; url: string }

// 결과 공유하기: 결과별 링크(친구가 누르면 결과 미리보기와 '나도 해보기')와 1인칭 문구를 기본 공유창으로 보낸다.
// 공유창이 없으면 링크를 복사한다. 이미지는 '이미지 저장'으로 따로 받는다.
export function useResultShare(meta: ShareMeta | null) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const key = meta?.url ?? "";
  useEffect(() => { setNotice(null); }, [key]);

  const share = useCallback(async () => {
    if (!meta) return;
    setBusy(true);
    setNotice(null);
    try {
      const out = await shareResult({ file: null, ...meta });
      if (out === "copied") setNotice(SHARE_NOTICE.copied);
      if (out === "failed") setNotice(SHARE_NOTICE.failed);
    } finally {
      setBusy(false);
    }
  }, [meta]);

  return { busy, notice, share };
}

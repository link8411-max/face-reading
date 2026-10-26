"use client";

import { useCallback, useEffect, useState } from "react";
import { shareResult, SHARE_NOTICE } from "@/lib/share";
import { isKakaoInApp, loadKakao, shareKakao } from "@/lib/kakao";
import { track, type TestName } from "@/lib/analytics";

export interface ShareMeta { testName: TestName; title: string; text: string; url: string; imageUrl: string }

// 결과 공유하기: 결과별 링크(친구가 누르면 결과 미리보기와 '나도 해보기')와 1인칭 문구를 보낸다.
// - 카카오톡 인앱: 기기 공유창이 없어서 카카오톡 공유 화면으로 보낸다(실패하면 아래로)
// - 그 밖: 기기 기본 공유창, 없으면 링크 복사
export function useResultShare(meta: ShareMeta | null) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const key = meta?.url ?? "";
  useEffect(() => {
    setNotice(null);
    // 카톡 안에서는 결과가 나오면 SDK를 미리 불러 둔다 (누른 뒤 기다림 줄이기)
    if (key && isKakaoInApp(navigator.userAgent)) void loadKakao();
  }, [key]);

  const share = useCallback(async () => {
    if (!meta) return;
    setBusy(true);
    setNotice(null);
    try {
      if (isKakaoInApp(navigator.userAgent) && (await shareKakao(meta))) {
        track("share_click", { test_name: meta.testName, method: "kakao" });
        return;
      }
      track("share_click", { test_name: meta.testName, method: "link" });
      const out = await shareResult({ file: null, title: meta.title, text: meta.text, url: meta.url });
      if (out === "copied") setNotice(SHARE_NOTICE.copied);
      if (out === "failed") setNotice(SHARE_NOTICE.failed);
    } finally {
      setBusy(false);
    }
  }, [meta]);

  return { busy, notice, share };
}

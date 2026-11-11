"use client";

import { useCallback, useEffect, useState } from "react";
import { shareResult, SHARE_NOTICE, type ShareOutcome } from "@/lib/share";
import { isKakaoInApp, loadKakao, shareKakao } from "@/lib/kakao";
import { track, type TestName } from "@/lib/analytics";
import type { KakaoImage } from "@/lib/bujeok/giftShare";

export interface ShareMeta {
  testName: TestName; title: string; text: string; url: string; imageUrl: string;
  // 선택: 미리 만들어 둔 그림 파일(기본 공유창에 파일로), 카카오 카드 이미지 고르기(올린 그림 → 실패하면 fallback). 부적 선물이 쓴다
  getFile?: () => File | null;
  getKakaoImage?: (fallback: KakaoImage) => Promise<KakaoImage>;
}

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

  // 끝난 방식을 돌려준다(부적함이 "실제로 보냈을 때"만 저장하려고). 카카오톡은 공유 화면이 열리면 'kakao'
  const share = useCallback(async (): Promise<ShareOutcome | "kakao" | null> => {
    if (!meta) return null;
    setBusy(true);
    setNotice(null);
    try {
      if (isKakaoInApp(navigator.userAgent)) {
        const og: KakaoImage = { url: meta.imageUrl, width: 1200, height: 630 };
        const img = meta.getKakaoImage ? await meta.getKakaoImage(og) : og;
        if (await shareKakao({ ...meta, imageUrl: img.url, imageSize: { width: img.width, height: img.height } })) {
          track("share_click", { test_name: meta.testName, method: "kakao" });
          return "kakao";
        }
      }
      track("share_click", { test_name: meta.testName, method: "link" });
      const out = await shareResult({ file: meta.getFile?.() ?? null, title: meta.title, text: meta.text, url: meta.url });
      if (out === "copied") setNotice(SHARE_NOTICE.copied);
      if (out === "failed") setNotice(SHARE_NOTICE.failed);
      return out;
    } finally {
      setBusy(false);
    }
  }, [meta]);

  return { busy, notice, share };
}

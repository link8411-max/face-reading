"use client";

import { Icon } from "@/components/icons";
import { useResultShare } from "@/hooks/useResultShare";
import type { TestName } from "@/lib/analytics";

// 글 하단 공유하기: 결과 화면의 공유와 같은 훅(카카오톡 인앱은 카카오 공유, 그 밖엔 기본 공유창 또는 링크 복사)
export default function ArticleShare({ testName, title, text, url, imageUrl }: { testName: TestName; title: string; text: string; url: string; imageUrl: string }) {
  const { busy, notice, share } = useResultShare({ testName, title, text, url, imageUrl });
  return (
    <div className="no-screenshot flex flex-col">
      <button type="button" onClick={share} disabled={busy} className="h-[48px] rounded-full border border-line bg-white text-ink font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-50">
        <Icon name="share" size={18} />
        공유하기
      </button>
      {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
    </div>
  );
}

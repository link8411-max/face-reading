"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

// 결과 버튼 (디자인 시안 ResultCard): 1순위 스토리에 올리기, 2순위 이미지 저장·다시하기.
// "친구 얼굴이랑 궁합"은 8단계에서 기능이 생기면 넣는다.
export default function ResultActions({ onStory, onSave, onRetry, busy, notice }: {
  onStory: () => void;
  onSave: () => void;
  onRetry: () => void;
  busy: boolean;
  notice: string | null;
}) {
  return (
    <div className="no-screenshot flex flex-col">
      <button type="button" onClick={onStory} disabled={busy} className="mt-4 h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium disabled:opacity-50">
        <Icon name="story" size={18} />
        {busy ? "이미지 만드는 중…" : "스토리에 올리기"}
      </button>
      {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button type="button" onClick={onSave} disabled={busy} className="h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Icon name="download" size={16} />
          이미지 저장
        </button>
        <button type="button" onClick={onRetry} className="h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5">
          <Icon name="refresh" size={16} />
          다시하기
        </button>
      </div>
      <Link href="/" className="mt-2.5 text-center text-[13px] text-muted py-3">다른 테스트 보기</Link>
    </div>
  );
}

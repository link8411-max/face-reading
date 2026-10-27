"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

// 결과 버튼: 1순위 공유하기(휴대폰 기본 공유창), 2순위 이미지 저장·다시하기.
// lead: 공유하기보다 앞에 두는 링크(삼국지 → 우리 팀 삼국지), companion: 이미지 저장 옆 짝 기능(동물상 → 얼굴 궁합)
export default function ResultActions({ onShare, onSave, onRetry, busy, notice, lead, companion }: {
  lead?: { label: string; href: string };
  companion?: { label: string; href: string };
  onShare: () => void;
  onSave: () => void;
  onRetry: () => void;
  busy: boolean;
  notice: string | null;
}) {
  return (
    <div className="no-screenshot flex flex-col">
      {lead && (
        <Link href={lead.href} className="mt-4 h-[52px] rounded-full flex items-center justify-center gap-2 bg-ink text-paper text-[15px] font-medium">
          <Icon name="users" size={18} />
          {lead.label}
        </Link>
      )}
      <button type="button" onClick={onShare} disabled={busy} className={`${lead ? "mt-2 bg-white text-ink border border-line" : "mt-4 bg-ink text-paper"} h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-medium disabled:opacity-50`}>
        <Icon name="share" size={18} />
        {busy ? "공유 준비 중…" : "공유하기"}
      </button>
      {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {companion && (
          <Link href={companion.href} className="h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5">
            <Icon name="heart" size={16} />
            {companion.label}
          </Link>
        )}
        <button type="button" onClick={onSave} disabled={busy} className="h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Icon name="download" size={16} />
          이미지 저장
        </button>
        {!companion && (
          <button type="button" onClick={onRetry} className="h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5">
            <Icon name="refresh" size={16} />
            다시하기
          </button>
        )}
      </div>
      {companion && (
        <button type="button" onClick={onRetry} className="mt-2 h-11 rounded-full text-sm text-muted flex items-center justify-center gap-1.5">
          <Icon name="refresh" size={16} />
          다시하기
        </button>
      )}
      <Link href="/" className="mt-2.5 text-center text-[13px] text-muted py-3">다른 테스트 보기</Link>
    </div>
  );
}

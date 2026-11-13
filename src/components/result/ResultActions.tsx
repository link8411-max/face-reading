"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import GiftNudge from "@/components/bujeok/GiftNudge";
import type { TestName } from "@/lib/analytics";
import { useT, useLocale } from "@/lib/i18n/LocaleProvider";
import { localePath } from "@/lib/i18n/locales";

// 결과 버튼: 1순위 공유하기(바로 아래 부적 선물 줄)(휴대폰 기본 공유창), 2순위 이미지 저장·다시하기.
// lead: 공유하기보다 앞에 두는 링크(삼국지 → 우리 팀 삼국지), companion: 이미지 저장 옆 짝 기능(동물상 → 얼굴 궁합)
export default function ResultActions({ from, onShare, onSave, onRetry, busy, notice, lead, companion, retryLabel }: {
  from: TestName; // 부적 선물 줄(GiftNudge)의 출발 화면
  retryLabel?: string;
  lead?: { label: string; href: string };
  companion?: { label: string; href: string };
  onShare: () => void;
  onSave: () => void;
  onRetry: () => void;
  busy: boolean;
  notice: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const en = locale === "en";
  const retry = retryLabel ?? t("btn.tryAgain");
  return (
    <div className="no-screenshot flex flex-col">
      {lead && (
        <Link href={lead.href} className="press mt-4 h-[52px] rounded-full flex items-center justify-center gap-2 bg-accent text-white text-[15px] font-medium">
          <Icon name="users" size={18} />
          {lead.label}
        </Link>
      )}
      <button type="button" onClick={onShare} disabled={busy} className={`press ${lead ? "mt-2 bg-white text-ink border border-line" : "mt-4 bg-accent text-white"} h-[52px] rounded-full flex items-center justify-center gap-2 text-[15px] font-medium disabled:opacity-50`}>
        <Icon name="share" size={18} />
        {busy ? t("btn.sharePreparing") : t("btn.share")}
      </button>
      {notice && <p role="status" className="mt-2 text-xs text-center text-muted">{notice}</p>}
      {!en && <GiftNudge from={from} />}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {companion && (
          <Link href={companion.href} className="press h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5">
            <Icon name="heart" size={16} />
            {companion.label}
          </Link>
        )}
        <button type="button" onClick={onSave} disabled={busy} className="press h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Icon name="download" size={16} />
          {t("btn.saveImage")}
        </button>
        {!companion && (
          <button type="button" onClick={onRetry} className="press h-12 rounded-full bg-white text-ink border border-line text-sm font-medium flex items-center justify-center gap-1.5">
            <Icon name="refresh" size={16} />
            {retry}
          </button>
        )}
      </div>
      {companion && (
        <button type="button" onClick={onRetry} className="mt-2 h-11 rounded-full text-sm text-muted flex items-center justify-center gap-1.5">
          <Icon name="refresh" size={16} />
          {retry}
        </button>
      )}
      <Link href={localePath(locale, "/")} className="mt-2.5 text-center text-[13px] text-muted py-3">{t("btn.tryAnother")}</Link>
    </div>
  );
}

"use client";

import { track } from "@/lib/analytics";
import { useResultShare } from "@/hooks/useResultShare";
import { mbtiShared, ogImageUrl } from "@/lib/shareLinks";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MBTI_TYPES, compatSummary, isMbti, type MbtiType } from "@/lib/mbti/compat";
import { mbtiProfiles } from "@/content/mbtiTypes";
import { useScreenshot } from "@/hooks/useScreenshot";

function TypeGroup({ label, value, onChange }: { label: string; value: MbtiType | null; onChange: (t: MbtiType) => void }) {
  return (
    <div role="group" aria-label={label}>
      <p className="font-bold text-sm mb-2">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {MBTI_TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={value === t} onClick={() => onChange(t)}
            className={`py-2 rounded-xl text-sm font-bold border transition ${value === t ? "bg-ink text-paper border-ink" : "bg-white border-line text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-10 text-muted">{label}</span>
      <span className="flex-1 h-2.5 rounded-full bg-card-2 overflow-hidden"><span className="block h-full bg-accent rounded-full" style={{ width: `${score}%` }} /></span>
      <span className="w-8 text-right font-bold">{score}</span>
    </div>
  );
}

// MBTI 궁합 계산기: 두 유형을 고르면 궁합 결과 카드 (저장 이미지에 사이트 주소 포함)
export default function MatchCalculator({ initial }: { initial?: { a: MbtiType; b: MbtiType; fromShare: boolean } } = {}) {
  const [a, setA] = useState<MbtiType | null>(initial?.a ?? null);
  const [b, setB] = useState<MbtiType | null>(initial?.b ?? null);
  const [shown, setShown] = useState(!!initial);
  const [fromShare, setFromShare] = useState(initial?.fromShare ?? false);
  const { ref, isCapturing, download } = useScreenshot();
  const link = shown && a && b ? mbtiShared(a, b) : null;
  const { busy, notice, share } = useResultShare(link ? { testName: "mbti_match", title: "운명을 읽다 · MBTI 궁합", text: link.phrase, url: link.url, imageUrl: ogImageUrl("mbti", link.a, null, link.b) } : null);

  // 친구가 보낸 궁합 링크(/mbti/r/a-b)로 들어온 방문은 GA에서 구분한다
  useEffect(() => {
    if (initial?.fromShare) track("shared_landing", { test_name: "mbti_match", result_id: `${initial.a}_${initial.b}` });
  }, [initial]);

  // 유형 페이지에서 ?a=INFP&b=ENFJ 로 들어오면 미리 골라 둔다
  useEffect(() => {
    if (initial) return;
    const q = new URLSearchParams(window.location.search);
    const qa = q.get("a")?.toUpperCase() ?? "", qb = q.get("b")?.toUpperCase() ?? "";
    if (isMbti(qa)) setA(qa);
    if (isMbti(qb)) setB(qb);
    if (isMbti(qa) && isMbti(qb)) setShown(true);
  }, [initial]);

  if (shown && a && b) {
    const s = compatSummary(a, b);
    const opts = { fileName: `MBTI궁합_${a}_${b}` };
    return (
      <div className="space-y-4">
        {fromShare && (
          <div className="bg-card rounded-[22px] p-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">친구가 보낸 궁합이에요</p>
            <button type="button" onClick={() => { setFromShare(false); setA(null); setB(null); setShown(false); }} className="h-10 px-4 rounded-full bg-ink text-paper text-sm font-medium flex-none">내 궁합 보기</button>
          </div>
        )}
        <section aria-label="궁합 결과" ref={ref} className="bg-white border-2 border-accent/30 rounded-3xl p-5 text-center">
          <p className="text-sm text-muted">MBTI 궁합</p>
          <p className="font-serif text-3xl font-bold mt-1"><span className="text-accent">{a}</span> × <span className="text-ink">{b}</span></p>
          <p className="mt-3"><span data-testid="total-score" className="text-5xl font-bold text-accent">{s.total}</span><span className="text-lg font-bold">점</span></p>
          <p className="inline-block mt-2 text-sm font-bold px-3 py-1 rounded-full bg-card-2 text-accent">{s.label}</p>
          <div className="space-y-1.5 mt-4 text-left"><Bar label="연애" score={s.love} /><Bar label="친구" score={s.friend} /><Bar label="직장" score={s.work} /></div>
          <ul className="text-left text-sm leading-relaxed mt-4 space-y-1">{s.lines.map((l) => <li key={l}>· {l}</li>)}</ul>
          <p className="text-xs text-muted mt-4">unse-ai.com/mbti/match · 재미로 보는 궁합</p>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { track("share_click", { test_name: "mbti_match", method: "save_image" }); download(opts); }} disabled={isCapturing} className="py-3 rounded-full bg-white border border-line font-bold">{isCapturing ? "저장 중…" : "결과 저장"}</button>
          <button type="button" onClick={share} disabled={busy} className="py-3 rounded-full bg-ink text-paper font-bold">공유하기</button>
        </div>
        {notice && <p role="status" className="text-xs text-center text-muted">{notice}</p>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href={`/mbti/${a.toLowerCase()}`} className="text-center py-2.5 rounded-xl bg-card-2 font-bold">{a}: {mbtiProfiles[a].nickname}</Link>
          <Link href={`/mbti/${b.toLowerCase()}`} className="text-center py-2.5 rounded-xl bg-card-2 font-bold">{b}: {mbtiProfiles[b].nickname}</Link>
        </div>
        <button type="button" onClick={() => setShown(false)} className="w-full py-3 rounded-full border border-line bg-white font-bold">다시 고르기</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TypeGroup label="나의 MBTI" value={a} onChange={setA} />
      <TypeGroup label="상대의 MBTI" value={b} onChange={setB} />
      <button type="button" disabled={!a || !b} onClick={() => { setShown(true); if (a && b) track("result_view", { test_name: "mbti_match", result_id: `${a}_${b}` }); }}
        className="w-full h-[52px] rounded-full bg-ink text-paper font-medium text-[15px] disabled:opacity-45">
        {a && b ? `${a} × ${b} 궁합 보기` : "두 유형을 골라 궁합 보기"}
      </button>
    </div>
  );
}

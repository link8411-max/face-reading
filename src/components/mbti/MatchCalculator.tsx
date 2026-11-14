"use client";

import GiftNudge from "@/components/bujeok/GiftNudge";
import { track } from "@/lib/analytics";
import { useResultShare } from "@/hooks/useResultShare";
import { mbtiShared, ogImageUrl, parseMbtiGenders } from "@/lib/shareLinks";
import { mbtiArt, type ArtGender } from "@/lib/art";
import { loadGender } from "@/lib/genderMemory";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MBTI_TYPES, compatSummary, isMbti, type MbtiType } from "@/lib/mbti/compat";
import { mbtiProfiles } from "@/content/mbtiTypes";
import { useScreenshot } from "@/hooks/useScreenshot";

const G_LABEL: Record<ArtGender, string> = { f: "여", m: "남" };

// 성별 고르기(작은 두 칸). 고른 성별의 그 유형 캐릭터가 결과에 나온다(11/14 사용자 "궁합에서도 둘 다 보여줘야")
function GenderToggle({ label, value, onChange }: { label: string; value: ArtGender; onChange: (g: ArtGender) => void }) {
  return (
    <div role="radiogroup" aria-label={`${label} 성별`} className="flex gap-1 p-0.5 rounded-full bg-card border border-line">
      {(["f", "m"] as const).map((g) => (
        <button key={g} type="button" role="radio" aria-checked={value === g} onClick={() => onChange(g)}
          className={`h-8 px-3 rounded-full text-xs font-bold ${value === g ? "bg-ink text-paper" : "text-muted"}`}>
          {G_LABEL[g]}
        </button>
      ))}
    </div>
  );
}

export function TypeGroup({ label, value, onChange, gender, onGender }: { label: string; value: MbtiType | null; onChange: (t: MbtiType) => void; gender?: ArtGender; onGender?: (g: ArtGender) => void }) {
  return (
    <div role="group" aria-label={label}>
      <div className="flex items-center gap-2.5 mb-2">
        {value && gender && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mbtiArt(value, gender).face} alt={`${value} ${G_LABEL[gender]} 캐릭터`} width={40} height={40} className="w-10 h-10 rounded-full object-cover bg-card-2 border border-line" />
        )}
        <p className="font-bold text-sm flex-1">{label}{value ? ` · ${value}` : ""}</p>
        {gender && onGender && <GenderToggle label={label} value={gender} onChange={onGender} />}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {MBTI_TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={value === t} onClick={() => onChange(t)}
            className={`py-2 rounded-xl text-sm font-bold border transition ${value === t ? "bg-ink text-paper border-ink" : "bg-card border-line text-ink"}`}>
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
export default function MatchCalculator({ initial }: { initial?: { a: MbtiType; b: MbtiType; fromShare: boolean; g?: [ArtGender, ArtGender] | null } } = {}) {
  const [a, setA] = useState<MbtiType | null>(initial?.a ?? null);
  const [b, setB] = useState<MbtiType | null>(initial?.b ?? null);
  // 두 캐릭터의 성별: 공유 링크 값 → 없으면 처음엔 나 여·상대 남, 화면이 뜨면 기억한 내 성별로(상대는 반대)
  const [ga, setGa] = useState<ArtGender>(initial?.g?.[0] ?? "f");
  const [gb, setGb] = useState<ArtGender>(initial?.g?.[1] ?? "m");
  useEffect(() => {
    if (initial?.g) return;
    const me = loadGender();
    if (me) { setGa(me === "남" ? "m" : "f"); setGb(me === "남" ? "f" : "m"); }
  }, [initial]);
  const [shown, setShown] = useState(!!initial);
  const [fromShare, setFromShare] = useState(initial?.fromShare ?? false);
  const { ref, isCapturing, download } = useScreenshot();
  const link = shown && a && b ? mbtiShared(a, b, [ga, gb]) : null;
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
    const qg = parseMbtiGenders(q.get("g"));
    if (qg) { setGa(qg[0]); setGb(qg[1]); }
    if (isMbti(qa) && isMbti(qb)) setShown(true);
  }, [initial]);

  if (shown && a && b) {
    const s = compatSummary(a, b);
    const opts = { fileName: `MBTI궁합_${a}_${b}` };
    return (
      <div className="space-y-4">
        {fromShare && (
          <div className="bg-card border border-line rounded-[22px] p-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">친구가 보낸 궁합이에요</p>
            <button type="button" onClick={() => { setFromShare(false); setA(null); setB(null); setShown(false); }} className="h-10 px-4 rounded-full bg-accent text-white text-sm font-medium flex-none">내 궁합 보기</button>
          </div>
        )}
        <section aria-label="궁합 결과" ref={ref} className="bg-card border-2 border-accent/30 rounded-3xl p-5 text-center">
          <p className="text-sm text-muted">MBTI 궁합</p>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {([[a, ga], [b, gb]] as const).map(([t, g], i) => (
              <figure key={i} className={i === 0 ? "col-start-1" : "col-start-3"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mbtiArt(t, g).src} alt={`${t} ${G_LABEL[g]} 캐릭터`} width={720} height={960} className="block w-full h-auto aspect-[3/4] object-cover rounded-[18px] border border-line bg-card-2" />
                <figcaption className={`mt-1.5 font-serif text-xl font-bold ${i === 0 ? "text-accent-ink" : "text-ink"}`}>{t}</figcaption>
              </figure>
            ))}
            <span aria-hidden className="col-start-2 row-start-1 font-serif text-2xl font-bold text-muted">×</span>
          </div>
          <p className="mt-3"><span data-testid="total-score" className="text-5xl font-bold text-accent-ink">{s.total}</span><span className="text-lg font-bold">점</span></p>
          <p className="inline-block mt-2 text-sm font-bold px-3 py-1 rounded-full bg-card-2 text-accent-ink">{s.label}</p>
          <div className="space-y-1.5 mt-4 text-left"><Bar label="연애" score={s.love} /><Bar label="친구" score={s.friend} /><Bar label="직장" score={s.work} /></div>
          <ul className="text-left text-sm leading-relaxed mt-4 space-y-1">{s.lines.map((l) => <li key={l}>· {l}</li>)}</ul>
          <p className="text-xs text-muted mt-4">unse-ai.com/mbti/match · 재미로 보는 궁합</p>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { track("share_click", { test_name: "mbti_match", method: "save_image" }); download(opts); }} disabled={isCapturing} className="py-3 rounded-full bg-card border border-line font-bold">{isCapturing ? "저장 중…" : "결과 저장"}</button>
          <button type="button" onClick={share} disabled={busy} className="py-3 rounded-full bg-accent text-white font-bold">공유하기</button>
        </div>
        {notice && <p role="status" className="text-xs text-center text-muted">{notice}</p>}
        <GiftNudge from="mbti_match" />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href={`/mbti/${a.toLowerCase()}`} className="text-center py-2.5 rounded-xl bg-card-2 font-bold">{a}: {mbtiProfiles[a].nickname}</Link>
          <Link href={`/mbti/${b.toLowerCase()}`} className="text-center py-2.5 rounded-xl bg-card-2 font-bold">{b}: {mbtiProfiles[b].nickname}</Link>
        </div>
        <button type="button" onClick={() => setShown(false)} className="w-full py-3 rounded-full border border-line bg-card font-bold">다시 고르기</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TypeGroup label="나의 MBTI" value={a} onChange={setA} gender={ga} onGender={setGa} />
      <TypeGroup label="상대의 MBTI" value={b} onChange={setB} gender={gb} onGender={setGb} />
      <button type="button" disabled={!a || !b} onClick={() => { setShown(true); if (a && b) track("result_view", { test_name: "mbti_match", result_id: `${a}_${b}` }); }}
        className="w-full h-[52px] rounded-full bg-accent text-white font-medium text-[15px] disabled:opacity-45">
        {a && b ? `${a} × ${b} 궁합 보기` : "두 유형을 골라 궁합 보기"}
      </button>
    </div>
  );
}

// MBTI 상세의 "잘 맞는 유형"을 삼국지 열전 상관도처럼 그림으로(11/14 사용자 "상세 내에 궁합이 제일 잘 맞는 거 보여 주고, 삼국지 상세처럼").
// 위: 찰떡 1위 카드(내 유형 × 연애 궁합 1위 두 캐릭터 + 점수), 아래: 가운데 내 유형, 둘레에 연애 1~3위·친구 1위·직장 1위 얼굴.
// 서버 컴포넌트(서버 HTML에 그림·글이 다 있다). 성별: 가운데는 처음 뽑은 성별, 연애 상대는 반대 성별, 친구·직장은 같은 성별.
import Link from "next/link";
import { mbtiArt, MBTI_BASE_GENDER, type ArtGender } from "@/lib/art";
import { bestMatches, compatScore, compatSummary, type MbtiType } from "@/lib/mbti/compat";
import { mbtiProfiles } from "@/content/mbtiTypes";

const other = (g: ArtGender): ArtGender => (g === "f" ? "m" : "f");

export interface MatchNode { type: MbtiType; labels: string[]; g: ArtGender; score: number }

// 둘레에 놓을 유형(중복은 한 칸에 이름표를 합친다). 연애 1~3위 → 친구 1위 → 직장 1위 순
export function matchNodes(type: MbtiType): MatchNode[] {
  const me = MBTI_BASE_GENDER[type];
  const out: MatchNode[] = [];
  const add = (t: MbtiType, label: string, g: ArtGender, score: number) => {
    const hit = out.find((n) => n.type === t);
    if (hit) hit.labels.push(label);
    else out.push({ type: t, labels: [label], g, score });
  };
  bestMatches(type, "love").forEach((t, i) => add(t, `연애 ${i + 1}위`, other(me), compatScore(type, t, "love")));
  add(bestMatches(type, "friend", 1)[0], "친구 1위", me, compatScore(type, bestMatches(type, "friend", 1)[0], "friend"));
  add(bestMatches(type, "work", 1)[0], "직장 1위", me, compatScore(type, bestMatches(type, "work", 1)[0], "work"));
  return out;
}

const SIZE = 340;
const C = SIZE / 2;
const R = 122;

export default function MbtiMatchMap({ type }: { type: MbtiType }) {
  const me = MBTI_BASE_GENDER[type];
  const best = bestMatches(type, "love", 1)[0];
  const s = compatSummary(type, best);
  const nodes = matchNodes(type);
  const pos = nodes.map((_, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
  });
  return (
    <div>
      {/* 찰떡 1위 */}
      <Link href={`/mbti/match?a=${type}&b=${best}&g=${me}${other(me)}`} className="block rounded-[22px] bg-paper border border-line p-3">
        <p className="text-xs text-muted text-center">연애 궁합 1위</p>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {([[type, me], [best, other(me)]] as const).map(([t, g], i) => (
            <figure key={t} className={i === 0 ? "col-start-1" : "col-start-3"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mbtiArt(t, g).src} alt={`${t} ${g === "f" ? "여자" : "남자"} 캐릭터`} width={720} height={960} loading="lazy" className="block w-full h-auto aspect-[3/4] object-cover rounded-[16px] border border-line bg-card-2" />
              <figcaption className="mt-1 text-center font-serif font-bold">{t}</figcaption>
            </figure>
          ))}
          <span aria-hidden className="col-start-2 row-start-1 font-serif text-xl font-bold text-muted">×</span>
        </div>
        <p className="mt-2 text-center"><span className="text-3xl font-bold text-accent-ink">{s.love}</span><span className="font-bold">점</span> <span className="ml-1 text-sm font-bold px-2.5 py-0.5 rounded-full bg-card-2 text-accent-ink">{s.label}</span></p>
        <p className="mt-1 text-center text-xs text-muted">{mbtiProfiles[best].nickname} {best} · 눌러서 궁합 자세히 보기</p>
      </Link>

      {/* 궁합 상관도 */}
      <div className="relative mx-auto mt-5 w-full max-w-[340px] aspect-square" role="img" aria-label={`${type}와 잘 맞는 유형 관계도`}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 w-full h-full" aria-hidden>
          {pos.map((p, i) => (
            <line key={i} x1={C} y1={C} x2={p.x} y2={p.y} stroke="currentColor" className={nodes[i].labels.some((l) => l.startsWith("연애")) ? "text-accent-ink" : "text-muted"} strokeWidth={1.6} strokeDasharray={nodes[i].labels.some((l) => l.startsWith("연애")) ? undefined : "4 4"} />
          ))}
        </svg>
        <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: "50%", top: "50%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mbtiArt(type, me).face} alt="" width={240} height={240} loading="lazy" className="w-[84px] h-[84px] rounded-full object-cover border-2 border-accent bg-card-2" />
          <p className="mt-0.5 text-sm font-bold">{type}</p>
        </div>
        {nodes.map((n, i) => (
          <Link key={n.type} href={`/mbti/${n.type.toLowerCase()}`} className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-[86px]" style={{ left: `${(pos[i].x / SIZE) * 100}%`, top: `${(pos[i].y / SIZE) * 100}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mbtiArt(n.type, n.g).face} alt="" width={240} height={240} loading="lazy" className="mx-auto w-[58px] h-[58px] rounded-full object-cover border border-line bg-card-2" />
            <p className="text-[13px] font-bold leading-tight mt-0.5">{n.type}</p>
            <p className="text-[10px] text-accent-ink leading-tight">{n.labels.join(" · ")}</p>
          </Link>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-muted">실선은 연애 궁합, 점선은 친구·직장 궁합이에요.</p>
    </div>
  );
}

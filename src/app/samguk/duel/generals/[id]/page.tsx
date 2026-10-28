import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DUEL_GENERAL_INTRO } from "@/content/duelGuide";
import { BOSS_IDS, DUEL_GENERALS, getDuelGeneral } from "@/lib/duel/generals";
import { SKILLS } from "@/lib/duel/skills";
import { getCharacterById } from "@/lib/samgukDB";
import RosterStartLink from "@/components/duel/RosterStartLink";

type Props = { params: Promise<{ id: string }> };

const SITE = "https://unse-ai.com";
const BRAND = " – 운명을 읽다";
const STAT_KEYS = ["통솔", "무력", "지력", "정치", "매력"] as const;
const ROLE_LABEL = { starter: "시작 장수", recruit: "영입 장수", boss: "보스", mob: "졸개" } as const;

// 일기토 장수 페이지에 나오는 12명 (졸개 제외)
const GENERALS = DUEL_GENERALS.filter((g) => g.role !== "mob");

export const dynamicParams = false;

export function generateStaticParams() {
  return GENERALS.map((g) => ({ id: g.id }));
}

function bossWave(id: string): number | null {
  const i = BOSS_IDS.indexOf(id as (typeof BOSS_IDS)[number]);
  return i < 0 ? null : (i + 1) * 6;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const g = getDuelGeneral(id);
  const c = getCharacterById(id);
  if (!g || !c || g.role === "mob") return {};
  const title = `${g.name} 일기토 능력치·필살기${BRAND}`;
  const sig = SKILLS[DUEL_GENERAL_INTRO[id].signature].name;
  const description = `삼국지 일기토 ${g.name}(${g.kind})의 코에이 능력치와 필살기 ${sig}, 기술 4가지, 보스별 상성을 정리했어요.`;
  const url = `${SITE}/samguk/duel/generals/${id}`;
  const image = `/api/og?title=${encodeURIComponent(`${g.name} 일기토`)}&subtitle=${encodeURIComponent(sig)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "article", locale: "ko_KR", siteName: "운명을 읽다", url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function GeneralPage({ params }: Props) {
  const { id } = await params;
  const g = getDuelGeneral(id);
  const c = getCharacterById(id);
  const intro = DUEL_GENERAL_INTRO[id];
  if (!g || !c || !intro || g.role === "mob") notFound();

  const wave = bossWave(id);
  const url = `${SITE}/samguk/duel/generals/${id}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 일기토", item: `${SITE}/samguk/duel` },
      { "@type": "ListItem", position: 3, name: `${g.name} 능력치`, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto px-[22px] max-w-lg pb-12">
        <nav className="pt-5 text-sm text-muted" aria-label="경로">
          <Link href="/samguk/duel" className="underline">삼국지 일기토</Link> / 장수 소개
        </nav>

        <header className="mt-4 flex gap-4 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/samguk/${g.name}.jpg`} alt={`${g.name} 초상`} width={112} height={140} className="w-28 h-[140px] object-cover rounded-2xl border border-line flex-none" />
          <div className="min-w-0">
            <p className="text-sm text-muted">{ROLE_LABEL[g.role]} · {c.faction === "기타" ? "그 밖의 세력" : `${c.faction}나라`}</p>
            <h1 className="font-serif font-bold text-[27px] leading-[1.3] break-keep">{g.name} <span className="text-lg text-muted">{c.hanja}</span></h1>
            <p className="mt-1 text-sm">{g.kind} · 속도 {g.speed}</p>
          </div>
        </header>

        <section className="mt-6 space-y-3 leading-relaxed">
          <h2 className="font-serif font-bold text-lg">{g.name} 소개</h2>
          {intro.lines.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="font-serif font-bold text-lg mb-3">코에이 능력치</h2>
          <table className="w-full text-sm bg-white rounded-[22px] border border-line overflow-hidden">
            <tbody>
              {STAT_KEYS.map((k) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <th scope="row" className="w-16 text-left font-normal px-4 py-2.5">{k}</th>
                  <td className="py-2.5 pr-2">
                    <div className="bg-card rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-ink" style={{ width: `${c.stats[k]}%` }} />
                    </div>
                  </td>
                  <td className="w-12 text-right font-medium pr-4 py-2.5">{c.stats[k]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">삼국지 닮은꼴 테스트와 같은 능력치예요. 일기토에서는 이 가운데 통솔·무력·지력·매력이 쓰여요.</p>
        </section>

        <section className="mt-8">
          <h2 className="font-serif font-bold text-lg mb-3">기술 4가지</h2>
          <ul className="space-y-2">
            {g.skills.map((sid) => {
              const s = SKILLS[sid];
              const main = sid === intro.signature;
              return (
                <li key={sid} className="bg-white rounded-[18px] border border-line px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-keep">{s.name}{main && <span className="ml-2 text-xs text-muted">필살기</span>}</p>
                    <p className="text-xs text-muted">{s.kind}</p>
                  </div>
                  <p className="text-sm text-right flex-none">
                    위력 {s.power === 0 ? "없음" : s.power} · {s.uses === null ? "횟수 제한 없음" : `${s.uses}회`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-8">
          {/* 시작 장수 4명만 바로 시작 링크. 영입 장수는 이 기기 장수록에 있을 때만(RosterStartLink가 브라우저에서 바꾼다) */}
          {g.role === "starter" ? (
            <Link href={`/samguk/duel?me=${id}`} className="flex h-[52px] items-center justify-center rounded-full bg-ink text-paper font-medium">
              이 장수로 시작
            </Link>
          ) : g.role === "recruit" ? (
            <RosterStartLink id={id} />
          ) : (
            <p className="rounded-[18px] bg-card px-4 py-4 text-center">
              보스로 등장 — 웨이브 {wave}
              <span className="block text-xs text-muted mt-1">영입할 수 없는 상대예요. 이기면 다음 웨이브로 나아가요.</span>
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-serif font-bold text-lg mb-3">다른 장수</h2>
          <ul className="grid grid-cols-2 gap-2">
            {GENERALS.filter((o) => o.id !== id).map((o) => (
              <li key={o.id}>
                <Link href={`/samguk/duel/generals/${o.id}`} className="flex items-center justify-between rounded-full border border-line bg-white px-4 py-2.5 text-sm hover:border-accent/50 transition">
                  <span>{o.name}</span>
                  <span className="text-xs text-muted">{o.kind}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/samguk/duel" className="mt-4 block text-center underline text-sm">일기토 하러 가기</Link>
        </section>
      </main>
    </div>
  );
}

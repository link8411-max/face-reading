import type { Metadata } from "next";
import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import { factionLabel } from "@/components/people/PersonHeader";
import { PEOPLE_IDS } from "@/content/samgukPeople";
import { rankingView, type RankRow } from "@/lib/people/ranking";
import { factionGroups } from "@/lib/people/relations";
import { readCheerRanking, storeConfig } from "@/lib/people/store";
import { getCharacterById } from "@/lib/samgukDB";

const SITE = "https://unse-ai.com";
const URL = `${SITE}/samguk/people/ranking`;
const TITLE = "삼국지 인물 순위 | 가장 응원받는 장수 – 운명을 읽다";
const DESCRIPTION = "삼국지에서 가장 응원받는 장수는 누구일까요? 전체 순위와 위·촉·오 세력별 순위를 열전과 함께 확인해 보세요.";
const OG = `/api/og?title=${encodeURIComponent("삼국지 인물 순위")}&subtitle=${encodeURIComponent("가장 응원받는 장수")}`;

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", locale: "ko_KR", siteName: "운명을 읽다", url: URL, images: [{ url: OG, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG] },
  };
}

// 집계를 못 읽으면(환경 변수 없음, 저장소 오류) 빈 목록으로 본다. 페이지는 절대 던지지 않는다.
async function loadRows(): Promise<{ id: string; n: number }[]> {
  const cfg = storeConfig();
  if (!cfg) return [];
  try {
    return await readCheerRanking(cfg);
  } catch {
    return [];
  }
}

function Row({ id, rank, n }: { id: string; rank?: number; n?: number }) {
  const c = getCharacterById(id);
  return (
    <li>
      <Link href={`/samguk/people/${id}`} className="flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm hover:border-accent/50 transition">
        {n !== undefined && <span className="w-7 text-center font-bold tabular-nums">{rank}</span>}
        <span className="font-medium">{c?.name ?? id}</span>
        <span className="text-xs text-muted truncate">{c?.role}</span>
        {n !== undefined && <span className="ml-auto text-xs text-muted tabular-nums">{n}번 응원</span>}
      </Link>
    </li>
  );
}

// 세력 안 순위: 동점은 같은 순위(1, 1, 3)
function withRanks(rows: RankRow[]): RankRow[] {
  const out: RankRow[] = [];
  rows.forEach((r, i) => out.push({ ...r, rank: i > 0 && rows[i - 1].n === r.n ? out[i - 1].rank : i + 1 }));
  return out;
}

export default async function PeopleRankingPage() {
  const view = rankingView(await loadRows());
  const groups = factionGroups();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 인물열전", item: `${SITE}/samguk/people` },
      { "@type": "ListItem", position: 3, name: "인물 순위", item: URL },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto px-[22px] max-w-lg pt-6 pb-12">
        <nav className="text-sm text-muted" aria-label="경로">
          <Link href="/samguk/people" className="underline">삼국지 인물열전</Link> / 인물 순위
        </nav>
        <h1 className="mt-3 font-serif font-bold text-[27px] leading-[1.3] break-keep">삼국지 인물 순위</h1>
        <p className="mt-2 leading-relaxed text-muted">열전에서 응원 버튼이 가장 많이 눌린 장수 순서예요. 이름을 누르면 열전으로 가요.</p>

        {view.ready ? (
          <>
            <section className="mt-6">
              <h2 className="font-serif font-bold text-lg mb-3">전체 순위</h2>
              <ol className="space-y-2">
                {view.rows.map((r) => (
                  <Row key={r.id} id={r.id} rank={r.rank} n={r.n} />
                ))}
              </ol>
            </section>
            {groups.map((g) => {
              const rows = withRanks(view.rows.filter((r) => getCharacterById(r.id)?.faction === g.faction));
              if (rows.length === 0) return null;
              return (
                <section key={g.faction} className="mt-8">
                  <h2 className="font-serif font-bold text-lg mb-3">{factionLabel(g.faction)} 순위</h2>
                  <ol className="space-y-2">
                    {rows.map((r) => (
                      <Row key={r.id} id={r.id} rank={r.rank} n={r.n} />
                    ))}
                  </ol>
                </section>
              );
            })}
          </>
        ) : (
          <section className="mt-6">
            <div className="rounded-[22px] bg-card px-5 py-5 text-center">
              <p className="font-serif font-bold text-lg">응원을 모으는 중</p>
              <p className="mt-1 text-sm text-muted">응원이 조금 더 모이면 순위를 보여 드려요. 좋아하는 장수의 열전에서 응원해 주세요.</p>
            </div>
            <h2 className="mt-8 font-serif font-bold text-lg mb-3">열전이 있는 인물</h2>
            <ul className="space-y-2">
              {PEOPLE_IDS.map((id) => (
                <Row key={id} id={id} />
              ))}
            </ul>
          </section>
        )}

        <CoupangBanner subId="people-ranking" />
      </main>
    </div>
  );
}

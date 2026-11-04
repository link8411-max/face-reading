import type { Metadata } from "next";
import Link from "next/link";
import { BOARDS, BOARD_KEYS, type BoardKey } from "@/lib/cup/boards";
import { characterById } from "@/lib/people/characters";
import { readCupSummary, storeConfig } from "@/lib/people/store";

const SITE = "https://unse-ai.com";
const URL = `${SITE}/samguk/cup/ranking`;
const TITLE = "삼국지 장수 월드컵 순위 | 판별 우승 – 운명을 읽다";
const DESCRIPTION = "삼국지 장수 월드컵에서 판마다 가장 많이 우승한 장수와 대결에서 가장 많이 이긴 장수를 모아 보여 드려요.";
const OG = `/api/og?title=${encodeURIComponent("삼국지 장수 월드컵 순위")}&subtitle=${encodeURIComponent("판별 우승")}`;
const RANKED_BOARDS = BOARD_KEYS.filter((b) => b !== "random");
const TOP = 10;

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

type Count = { id: string; n: number };
type Summary = { wins: Record<BoardKey, Count[]>; matchWins: Count[] };

// 집계를 못 읽으면(환경 변수 없음, 저장소 오류) 빈 집계로 본다. 페이지는 절대 던지지 않는다.
async function loadSummary(): Promise<Summary | null> {
  const cfg = storeConfig();
  if (!cfg) return null;
  try {
    return await readCupSummary(cfg);
  } catch {
    return null;
  }
}

// 열전에 있는 인물만, 상위 TOP명
function top(rows: Count[]): Count[] {
  return rows.filter((r) => characterById(r.id)).slice(0, TOP);
}

// 동점은 같은 순위(1, 1, 3)
function withRanks(rows: Count[]): (Count & { rank: number })[] {
  const out: (Count & { rank: number })[] = [];
  rows.forEach((r, i) => out.push({ ...r, rank: i > 0 && rows[i - 1].n === r.n ? out[i - 1].rank : i + 1 }));
  return out;
}

function Row({ id, rank, n, unit }: { id: string; rank: number; n: number; unit: string }) {
  const c = characterById(id);
  return (
    <li>
      <Link href={`/samguk/people/${id}`} prefetch={false} className="flex min-h-[44px] items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm transition hover:border-accent/50">
        <span className="w-7 text-center font-bold tabular-nums">{rank}</span>
        <span className="font-medium">{c?.name ?? id}</span>
        <span className="truncate text-xs text-muted">{c?.role}</span>
        <span className="ml-auto text-xs text-muted tabular-nums">{n}{unit}</span>
      </Link>
    </li>
  );
}

export default async function CupRankingPage() {
  const summary = await loadSummary();
  const boards = summary ? RANKED_BOARDS.map((b) => ({ board: b, rows: top(summary.wins[b]) })).filter((x) => x.rows.length > 0) : [];
  const matchWins = summary ? top(summary.matchWins) : [];
  const ready = boards.length > 0 || matchWins.length > 0;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 장수 월드컵", item: `${SITE}/samguk/cup` },
      { "@type": "ListItem", position: 3, name: "순위", item: URL },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto max-w-lg px-[22px] pt-6 pb-12">
        <nav className="text-sm text-muted" aria-label="경로">
          <Link href="/samguk/cup" className="underline">삼국지 장수 월드컵</Link> / 순위
        </nav>
        <h1 className="mt-3 font-serif text-[27px] font-bold leading-[1.3] break-keep">삼국지 장수 월드컵 순위</h1>
        <p className="mt-2 leading-relaxed text-muted break-keep">판마다 우승한 횟수가 많은 장수 순서예요. 이름을 누르면 열전으로 가요.</p>

        {ready ? (
          <>
            {boards.map(({ board, rows }) => (
              <section key={board} className="mt-8">
                <h2 className="mb-3 font-serif text-lg font-bold">{BOARDS[board].title} 우승 순위</h2>
                <ol className="space-y-2">
                  {withRanks(rows).map((r) => (
                    <Row key={r.id} id={r.id} rank={r.rank} n={r.n} unit="번 우승" />
                  ))}
                </ol>
              </section>
            ))}
            {matchWins.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 font-serif text-lg font-bold">많이 이긴 장수</h2>
                <ol className="space-y-2">
                  {withRanks(matchWins).map((r) => (
                    <Row key={r.id} id={r.id} rank={r.rank} n={r.n} unit="번 승리" />
                  ))}
                </ol>
              </section>
            )}
          </>
        ) : (
          <section className="mt-6 rounded-[22px] bg-card px-5 py-5 text-center">
            <p className="font-serif text-lg font-bold">아직 우승 기록을 모으는 중이에요</p>
            <p className="mt-1 text-sm text-muted">첫 우승이 나오면 바로 순위를 보여 드려요.</p>
            <Link href="/samguk/cup" className="mx-auto mt-4 flex h-[52px] items-center justify-center rounded-full bg-ink text-base font-medium text-paper">
              판 고르기
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

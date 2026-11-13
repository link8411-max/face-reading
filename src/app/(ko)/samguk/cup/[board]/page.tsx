import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CupGame from "@/components/cup/CupGame";
import { BOARDS, BOARD_KEYS, boardPool, isBoardKey, type BoardKey } from "@/lib/cup/boards";
import { cupCards, meetNotes } from "@/lib/cup/cards";
import { cupName } from "@/lib/cup/share";
import { readCupSummary, storeConfig } from "@/lib/people/store";

type Props = { params: Promise<{ board: string }> };

const SITE = "https://unse-ai.com";

export const dynamicParams = false;
// 우승 순위는 한 시간마다 새로 읽는다(집계를 못 읽으면 순위 없이 보여 준다)
export const revalidate = 3600;

export function generateStaticParams() {
  return BOARD_KEYS.map((board) => ({ board }));
}

function titleOf(board: BoardKey) {
  return `${cupName(BOARDS[board].title)} – 운명을 읽다`;
}

function descriptionOf(board: BoardKey) {
  const b = BOARDS[board];
  return `${b.blurb} 가운데 둘씩 맞붙여 나의 최애 장수를 골라 보세요. 대결마다 다른 사람들의 선택 비율을 보여 드려요.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params;
  if (!isBoardKey(board)) return {};
  const title = titleOf(board);
  const description = descriptionOf(board);
  const url = `${SITE}/samguk/cup/${board}`;
  const image = `/api/og?title=${encodeURIComponent(cupName(BOARDS[board].title))}&subtitle=${encodeURIComponent("나의 최애 장수는?")}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", locale: "ko_KR", siteName: "운명을 읽다", url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// 이 판의 우승 순위 상위 5. 무작위 판은 순위를 매기지 않고, 집계를 못 읽으면(환경 변수 없음, 저장소 오류) 빈 목록이다.
async function loadTop5(board: BoardKey, names: Map<string, string>) {
  if (board === "random") return [];
  const cfg = storeConfig();
  if (!cfg) return [];
  try {
    const { wins } = await readCupSummary(cfg);
    return wins[board]
      .filter((w) => names.has(w.id))
      .slice(0, 5)
      .map((w) => ({ id: w.id, name: names.get(w.id) as string, n: w.n }));
  } catch {
    return [];
  }
}

export default async function CupBoardPage({ params }: Props) {
  const { board } = await params;
  if (!isBoardKey(board)) notFound();
  const pool = boardPool(board);
  const cards = cupCards(pool);
  const notes = meetNotes(pool);
  const top5 = await loadTop5(board, new Map(cards.map((c) => [c.id, c.name])));
  const { title, blurb, basis } = BOARDS[board];

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 장수 월드컵", item: `${SITE}/samguk/cup` },
      { "@type": "ListItem", position: 3, name: `${title} 월드컵`, item: `${SITE}/samguk/cup/${board}` },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto max-w-lg px-[22px] pt-6 pb-12">
        <nav className="text-sm text-muted" aria-label="경로">
          <Link href="/samguk/cup" className="underline">삼국지 장수 월드컵</Link> / {title}
        </nav>
        <h1 className="mt-3 text-center font-serif text-[27px] font-bold leading-[1.3] break-keep">{cupName(title)}</h1>
        <CupGame board={board} title={title} cards={cards} notes={notes} top5={top5} />
        <p className="mt-8 text-center text-xs leading-relaxed text-muted break-keep">
          {blurb}
          {basis ? ` · ${basis}` : ""}
        </p>
      </main>
    </div>
  );
}

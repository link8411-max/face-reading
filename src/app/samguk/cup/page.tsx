import type { Metadata } from "next";
import Link from "next/link";
import { BOARDS, BOARD_KEYS, boardPool, type BoardKey } from "@/lib/cup/boards";
import { characterById } from "@/lib/people/characters";
import { portraitSrc } from "@/lib/people/portrait";
import { readCupSummary, storeConfig } from "@/lib/people/store";

const SITE = "https://unse-ai.com";
const URL = `${SITE}/samguk/cup`;
const TITLE = "삼국지 장수 월드컵 | 최강 무장·책사·여인 16강 – 운명을 읽다";
const DESCRIPTION = "최강 무장·최고 책사·삼국지 여인·전체 무작위 16강. 장수마다 열전에서 뽑은 짧은 이야기를 읽고 골라 보세요.";
const OG = `/api/og?title=${encodeURIComponent("삼국지 장수 월드컵")}&subtitle=${encodeURIComponent("나의 최애 장수는?")}`;

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

// 판별 진행 수. 집계를 못 읽으면(환경 변수 없음, 저장소 오류) null이고 숫자를 숨긴다.
async function loadPlays(): Promise<Record<BoardKey, number> | null> {
  const cfg = storeConfig();
  if (!cfg) return null;
  try {
    return (await readCupSummary(cfg)).plays;
  } catch {
    return null;
  }
}

export default async function CupPickerPage() {
  const plays = await loadPlays();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 장수 월드컵", item: URL },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto max-w-lg px-[22px] pt-6 pb-12">
        <p className="text-sm font-medium text-accent">삼국지 장수 월드컵</p>
        <h1 className="mt-2 font-serif text-[27px] font-bold leading-[1.3] break-keep">누가 나의 최애 장수일까요?</h1>
        <p className="mt-2 leading-relaxed text-muted break-keep">16명 중 한 명을 고를 때마다 짧은 이야기를 읽어요</p>

        <ul className="mt-6 space-y-3">
          {BOARD_KEYS.map((board) => {
            const { title, blurb, basis } = BOARDS[board];
            const first = boardPool(board)[0];
            const src = first ? portraitSrc(first) : null;
            const n = plays?.[board] ?? 0;
            return (
              <li key={board}>
                <Link
                  href={`/samguk/cup/${board}`}
                  className="flex min-h-[44px] items-center gap-4 rounded-[26px] bg-card px-5 py-4 transition hover:bg-card-2"
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={`${characterById(first)?.name ?? ""} 도트 초상화`} width={64} height={76} className="h-[76px] w-16 flex-none rounded-2xl border-4 border-gold-game object-cover [image-rendering:pixelated]" />
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg font-bold break-keep">{title}</h2>
                    <p className="mt-0.5 text-sm text-ink break-keep">{blurb}</p>
                    {basis ? <p className="mt-0.5 text-xs text-muted break-keep">{basis}</p> : null}
                    {n > 0 ? <p className="mt-1 text-xs text-accent tabular-nums">지금까지 {n}판</p> : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/samguk/cup/ranking" className="flex h-[52px] items-center justify-center rounded-full border border-line bg-card-2 text-base font-medium">
            전체 순위 보기
          </Link>
          <Link href="/samguk/people" className="flex h-[52px] items-center justify-center rounded-full border border-line bg-card-2 text-base font-medium">
            삼국지 인물열전
          </Link>
        </div>
      </main>
    </div>
  );
}

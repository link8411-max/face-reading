import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BOARDS } from "@/lib/cup/boards";
import { cupName, cupOgImageUrl } from "@/lib/cup/share";
import { parseCupShare } from "@/lib/cup/shareLanding";
import { SITE } from "@/lib/shareBase";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import CoupangBanner from "@/components/CoupangBanner";

type Props = { params: Promise<{ board: string; id: string }> };

const DESCRIPTION = "친구가 고른 삼국지 장수 월드컵 최애 장수예요. 나도 골라 볼까?";

// 친구가 보낸 월드컵 결과 (검색 제외, 사이트맵 제외, canonical은 월드컵 첫 화면)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board, id } = await params;
  const s = parseCupShare(board, id);
  if (!s) return {};
  const image = cupOgImageUrl(s.board, s.id);
  return {
    title: `${s.phrase} | 운명을 읽다`,
    description: DESCRIPTION,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/samguk/cup` },
    openGraph: { title: s.phrase, description: DESCRIPTION, url: `${SITE}/samguk/cup/r/${s.board}/${s.id}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: s.phrase }] },
    twitter: { card: "summary_large_image", title: s.phrase, description: DESCRIPTION, images: [image] },
  };
}

export default async function CupSharePage({ params }: Props) {
  const { board, id } = await params;
  const s = parseCupShare(board, id);
  if (!s) redirect("/samguk/cup");
  return (
    <main className="mx-auto max-w-lg px-[22px] pt-8 pb-10">
      <SharedLandingTracker test="cup" resultId={s.board} />
      <p className="text-sm text-muted">친구의 최애 장수</p>
      <section className="mt-3 rounded-[30px] bg-card px-6 pt-7 pb-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image} alt={`${s.name} 도트 초상화`} className="h-28 w-24 flex-none rounded-2xl border-4 border-gold-game object-cover [image-rendering:pixelated]" />
          <div>
            <p className="font-medium text-accent">{cupName(BOARDS[s.board].title)}</p>
            <h1 className="mt-1 font-serif text-[27px] font-bold leading-[1.3] break-keep">{s.name}</h1>
          </div>
        </div>
      </section>
      <Link href={`/samguk/cup/${s.board}`} className="mt-5 flex h-[52px] items-center justify-center rounded-full bg-ink text-base font-medium text-paper">
        나도 해보기
      </Link>
      <Link href={`/samguk/people/${s.id}`} className="mt-2 flex h-[52px] items-center justify-center rounded-full border border-line bg-card-2 text-base font-medium">
        {s.name} 열전 보기
      </Link>
      <CoupangBanner subId="share-cup" />
    </main>
  );
}

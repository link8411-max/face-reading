import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { decodeRunKey } from "@/lib/duel/shareKey";
import { duelOgImageUrl, duelShared } from "@/lib/duel/share";
import { SITE } from "@/lib/shareBase";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";

type Props = { params: Promise<{ key: string }> };

const DESCRIPTION = "친구가 보낸 삼국지 일기토 기록이에요. 나도 출진해 볼까?";

// 친구가 보낸 일기토 기록 (검색 제외, 사이트맵 제외, canonical은 일기토 첫 화면)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const d = duelShared(key);
  if (!d) return {};
  const image = duelOgImageUrl(key);
  return {
    // 다른 공유 착지 페이지처럼 사이트 이름을 붙인다(og 제목은 문구만)
    title: `${d.headline} | 운명을 읽다`,
    description: DESCRIPTION,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/samguk/duel` },
    openGraph: { title: d.headline, description: DESCRIPTION, url: `${SITE}/samguk/duel/r/${key}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: d.headline }] },
    twitter: { card: "summary_large_image", title: d.headline, description: DESCRIPTION, images: [image] },
  };
}

export default async function DuelSharePage({ params }: Props) {
  const { key } = await params;
  const d = duelShared(key);
  const k = decodeRunKey(key);
  if (!d || !k) redirect("/samguk/duel");
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker test="duel" resultId={k.starter} />
      <p className="text-sm text-muted">친구가 보낸 일기토 기록</p>
      <section className="bg-card rounded-[30px] px-6 pt-7 pb-6 mt-3">
        <div className="flex gap-4 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.image} alt={`${d.starterName} 도트 초상화`} className="w-24 h-28 object-cover rounded-2xl border-4 border-gold-game [image-rendering:pixelated] flex-none" />
          <div>
            <p className="text-accent font-medium">{k.cleared ? "클리어" : `${k.wave}번째 싸움`}</p>
            <h1 className="font-serif font-bold text-[22px] leading-[1.45] mt-1 break-keep">{d.headline}</h1>
          </div>
        </div>
      </section>
      <Link href="/samguk/duel" className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-ink text-paper text-base font-medium">
        나도 일기토 하기
      </Link>
    </main>
  );
}

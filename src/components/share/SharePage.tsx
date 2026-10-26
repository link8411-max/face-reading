import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { josa, parseShared, SITE, TEST_NAME, type ShareKind, type SharedResult } from "@/lib/shareLinks";
import { animalTypeDB } from "@/lib/animalTypeDB";
import { samgukCharacters } from "@/lib/samgukDB";
import { MoonDeco, SmileFace } from "@/components/icons";
import SharedLandingTracker from "./SharedLandingTracker";

type P = Promise<{ key: string }>;
type S = Promise<{ s?: string | string[] }>;

const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

// 공유 링크 미리보기(카톡·인스타 봇은 JS를 실행하지 않으므로 서버 메타로 만든다).
// 결과 공유 페이지는 얇은 페이지라 검색 제외(noindex), canonical은 원래 테스트 페이지, 사이트맵에도 넣지 않는다.
export async function shareMetadata(kind: ShareKind, params: P, searchParams: S): Promise<Metadata> {
  const { key } = await params;
  const r = parseShared(kind, key, one((await searchParams).s));
  if (!r) return {};
  const image = `${SITE}/api/og/result?kind=${kind}&key=${encodeURIComponent(r.key)}${r.score !== null ? `&s=${r.score}` : ""}`;
  const description = `${TEST_NAME[kind]}로 나도 확인해 보세요. 사진은 저장되지 않아요.`;
  return {
    title: `${r.phrase} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}${r.testPath}` },
    openGraph: { title: r.phrase, description, url: `${SITE}${r.testPath}/r/${r.key}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: r.phrase }] },
    twitter: { card: "summary_large_image", title: r.phrase, description, images: [image] },
  };
}

function summaryOf(r: SharedResult): string {
  if (r.kind === "animal") return animalTypeDB[r.key].description.split(/(?<=[.!?])\s/)[0];
  if (r.kind === "samguk") return samgukCharacters.find((c) => c.id === r.key)!.modernComment;
  return `${TEST_NAME.face}에서 ${josa(r.name, "이", "가")} 나왔어요. 얼굴의 비율로 타고난 복과 연애운을 풀어 드려요.`;
}

export async function SharePage({ kind, params, searchParams }: { kind: ShareKind; params: P; searchParams: S }) {
  const { key } = await params;
  const r = parseShared(kind, key, one((await searchParams).s));
  if (!r) redirect(kind === "face" ? "/face2" : `/${kind}`);
  const scoreLabel = r.score !== null ? `닮음 ${r.score}%` : null;
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker kind={kind} resultId={r.key} />
      <p className="text-sm text-muted">친구가 보낸 결과</p>
      <section className="relative overflow-hidden bg-card rounded-[30px] px-6 pt-7 pb-6 mt-3">
        <span className="absolute -right-3 -top-2 pointer-events-none"><MoonDeco size={130} /></span>
        <h1 className="relative font-serif font-bold text-[26px] leading-[1.4] pr-16 break-keep">친구는 {kind === "samguk" ? `${josa(r.name, "을", "를")} 닮았대요` : `${josa(r.name, "이", "가")} 나왔어요`}</h1>
        {scoreLabel && <p className="relative text-accent font-medium mt-2">{scoreLabel}</p>}
        <div className="flex gap-4 items-center mt-5">
          {r.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image} alt={`${r.name} 도트 초상화`} className="w-24 h-28 object-cover rounded-2xl [image-rendering:pixelated] flex-none" />
          ) : (
            <SmileFace size={96} />
          )}
          <p className="text-sm leading-relaxed text-muted">{summaryOf(r)}</p>
        </div>
      </section>
      <Link href={r.testPath} className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-ink text-paper text-base font-medium">
        나도 해보기
      </Link>
      <p className="mt-3 text-xs text-center text-muted">사진은 내 폰 안에서만 보고 바로 지워요</p>
    </main>
  );
}

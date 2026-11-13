import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MoonDeco, SmileFace } from "@/components/icons";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import { GUANSANG_TYPES } from "@/content/en/guansang";
import { animalTypeDB } from "@/content/en/animal";
import { LANDING, SHARE_PHRASE } from "@/content/en/share";
import { t } from "@/lib/i18n/dict";
import { ogImageUrl, parseShared, SITE } from "@/lib/shareLinks";
import { animalArt } from "@/lib/animal/art";
import type { AnimalKey } from "@/lib/animal/matcher";
import type { GuansangTypeKey } from "@/lib/face/guansangKeys";

type P = Promise<{ key: string }>;
type S = Promise<{ s?: string | string[]; g?: string | string[] }>;
type EnKind = "animal" | "face";

const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
const TEST_PATH: Record<EnKind, string> = { animal: "/en/animal", face: "/en/face2" };

// 영어 결과 이름·1인칭 문구·제목. 키와 점수 검증은 한국어 착지와 같은 parseShared로 한다.
function enResult(kind: EnKind, key: string, s?: string | string[], g?: string | string[]) {
  const r = parseShared(kind, key, one(s), one(g));
  if (!r) return null;
  if (kind === "animal") {
    const d = animalTypeDB[r.key];
    return { r, name: d.name, title: LANDING.animalTitle(d.name, r.score!), phrase: SHARE_PHRASE.animal(d.name, r.score!), summary: d.description.split(/(?<=[.!?])\s/)[0] };
  }
  const f = GUANSANG_TYPES[r.key as GuansangTypeKey];
  return { r, name: f.nickname, title: LANDING.faceTitle(f.nickname), phrase: SHARE_PHRASE.face(f.nickname), summary: f.oneLiner };
}

// 영어 결과 공유 링크 미리보기. 한국어 착지와 같이 noindex, canonical은 영어 테스트 페이지, 사이트맵 제외.
export async function enShareMetadata(kind: EnKind, key: Promise<string>, searchParams: S): Promise<Metadata> {
  const e = enResult(kind, await key, (await searchParams).s);
  if (!e) return {};
  const image = ogImageUrl(kind, e.r.key, e.r.score, undefined, "en");
  const description = LANDING.ctaSub;
  return {
    title: `${e.phrase} | unse-ai.com`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}${TEST_PATH[kind]}` },
    openGraph: { title: e.phrase, description, url: `${SITE}${TEST_PATH[kind]}/r/${e.r.key}${e.r.score !== null ? `?s=${e.r.score}` : ""}`, siteName: "unse-ai.com", locale: "en_US", type: "website", images: [{ url: image, width: 1200, height: 630, alt: e.phrase }] },
    twitter: { card: "summary_large_image", title: e.phrase, description, images: [image] },
  };
}

export async function EnSharePage({ kind, keyP, searchParams }: { kind: EnKind; keyP: Promise<string>; searchParams: S }) {
  const sp = await searchParams;
  const e = enResult(kind, await keyP, sp.s, sp.g);
  if (!e) redirect(TEST_PATH[kind]);
  const hero = kind === "animal" ? animalArt(e.r.key as AnimalKey, e.r.g ?? "f").src : null;
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker kind={kind} resultId={e.r.key} />
      <p className="text-sm text-muted">{t("en", "brand.name")}</p>
      <section className="relative overflow-hidden bg-card border border-line rounded-[30px] px-6 pt-7 pb-6 mt-3">
        {!hero && <span className="absolute -right-3 -top-2 pointer-events-none"><MoonDeco size={130} /></span>}
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={`${e.name} result illustration`} width={720} height={960} className="relative block -mx-6 -mt-7 mb-5 w-[calc(100%+48px)] max-w-none h-auto aspect-[3/4] object-cover" />
        )}
        <h1 className="relative font-serif font-bold text-[26px] leading-[1.4] pr-16 break-keep">{e.title}</h1>
        <div className="flex gap-4 items-center mt-5">
          {!hero && <SmileFace size={96} />}
          <p className="text-sm leading-relaxed text-muted">{e.summary}</p>
        </div>
      </section>
      <Link href={TEST_PATH[kind]} className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-accent text-white text-base font-medium">
        {LANDING.cta}
      </Link>
      <p className="mt-3 text-xs text-center text-muted">{LANDING.ctaSub}</p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import FaceMatchCard from "@/components/faceMatch/FaceMatchCard";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import { animalTypeDB } from "@/content/en/animal";
import { REL_NAME } from "@/content/en/faceMatch";
import { LANDING, SHARE_PHRASE } from "@/content/en/share";
import { faceMatch } from "@/lib/faceMatch/compat";
import { EnCopyProvider } from "@/lib/i18n/copy";
import { parseFaceMatch, SITE } from "@/lib/shareLinks";

type Props = { params: Promise<{ pair: string }>; searchParams: Promise<{ rel?: string | string[] }> };
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";

// 영어로 보낸 얼굴 궁합 결과 (검색 제외, 사이트맵 제외). 키·관계 검증은 한국어 착지와 같은 parseFaceMatch.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const m = parseFaceMatch((await params).pair, one((await searchParams).rel));
  if (!m) return {};
  const result = faceMatch(m.a, m.b, m.rel, { animals: animalTypeDB });
  const phrase = SHARE_PHRASE.faceMatch(m.rel, REL_NAME[m.rel], m.score);
  const image = `${SITE}/api/og/result?kind=face-match&a=${m.a}&b=${m.b}&rel=${m.rel}&lang=en`;
  const description = LANDING.ctaSub;
  const title = LANDING.faceMatchTitle(result.headline);
  return {
    title: `${title} | unse-ai.com`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/en/face-match` },
    openGraph: { title: phrase, description, url: `${SITE}/en/face-match/r/${m.a}-${m.b}?rel=${m.rel}`, siteName: "unse-ai.com", locale: "en_US", type: "website", images: [{ url: image, width: 1200, height: 630, alt: phrase }] },
    twitter: { card: "summary_large_image", title: phrase, description, images: [image] },
  };
}

export default async function FaceMatchSharedPage({ params, searchParams }: Props) {
  const m = parseFaceMatch((await params).pair, one((await searchParams).rel));
  if (!m) redirect("/en/face-match");
  const result = faceMatch(m.a, m.b, m.rel, { animals: animalTypeDB });
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker test="face_match" resultId={`${m.a}_${m.b}_${m.rel}`} />
      <EnCopyProvider copy={{ animals: animalTypeDB }}>
        <FaceMatchCard a={m.a} b={m.b} rel={m.rel} result={result} />
      </EnCopyProvider>
      <Link href="/en/face-match" className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-accent text-white text-base font-medium">{LANDING.cta}</Link>
      <p className="mt-3 text-xs text-center text-muted">{LANDING.ctaSub}</p>
    </main>
  );
}

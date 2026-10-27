import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import FaceMatchCard from "@/components/faceMatch/FaceMatchCard";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import { parseFaceMatch, SITE } from "@/lib/shareLinks";

type Props = { params: Promise<{ pair: string }>; searchParams: Promise<{ rel?: string | string[] }> };
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";

// 친구가 보낸 얼굴 궁합 결과 (검색 제외, 사이트맵 제외)
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const m = parseFaceMatch((await params).pair, one((await searchParams).rel));
  if (!m) return {};
  const image = `${SITE}/api/og/result?kind=face-match&a=${m.a}&b=${m.b}&rel=${m.rel}`;
  const description = "두 사람 얼굴로 보는 친구·연인·짝사랑 궁합. 나도 해 보세요.";
  return {
    title: `${m.phrase} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/face-match` },
    openGraph: { title: m.phrase, description, url: `${SITE}/face-match/r/${m.a}-${m.b}?rel=${m.rel}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: m.phrase }] },
    twitter: { card: "summary_large_image", title: m.phrase, description, images: [image] },
  };
}

export default async function FaceMatchSharedPage({ params, searchParams }: Props) {
  const m = parseFaceMatch((await params).pair, one((await searchParams).rel));
  if (!m) redirect("/face-match");
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker test="face_match" resultId={`${m.a}_${m.b}_${m.rel}`} />
      <p className="text-sm text-muted mb-3">친구가 본 얼굴 궁합</p>
      <FaceMatchCard a={m.a} b={m.b} rel={m.rel} result={m.result} />
      <Link href="/face-match" className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-ink text-paper text-base font-medium">나도 해보기</Link>
      <p className="mt-3 text-xs text-center text-muted">사진은 내 폰 안에서만 보고 바로 지워요</p>
    </main>
  );
}

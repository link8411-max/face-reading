import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FaceMatchClient from "@/components/faceMatch/FaceMatchClient";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import { parseInvite, SITE } from "@/lib/shareLinks";
import type { AnimalKey } from "@/lib/animal/matcher";

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ rel?: string | string[] }> };
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";

// 친구가 보낸 얼굴 궁합 초대 (검색 제외, 사이트맵 제외)
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const inv = parseInvite((await params).key, one((await searchParams).rel));
  if (!inv) return {};
  const image = `${SITE}/api/og/result?kind=invite&key=${inv.key}&rel=${inv.rel}`;
  const description = "내 사진을 올리면 친구와의 얼굴 궁합이 바로 나와요. 사진은 저장되지 않아요.";
  return {
    title: `${inv.phrase} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/face-match` },
    openGraph: { title: inv.phrase, description, url: `${SITE}/face-match/i/${inv.key}?rel=${inv.rel}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: inv.phrase }] },
    twitter: { card: "summary_large_image", title: inv.phrase, description, images: [image] },
  };
}

export default async function FaceMatchInvitePage({ params, searchParams }: Props) {
  const inv = parseInvite((await params).key, one((await searchParams).rel));
  if (!inv) redirect("/face-match");
  return (
    <main className="mx-auto px-[22px] max-w-lg">
      <SharedLandingTracker test="face_match" resultId={`invite_${inv.key}_${inv.rel}`} />
      <header className="pt-5 pb-1"><h1 className="text-sm font-medium text-center">얼굴 궁합 초대</h1></header>
      <h2 className="mt-4 mb-5 font-serif font-bold text-[27px] leading-[1.4] break-keep">우리 {inv.rel === "lover" ? "연인" : "친구"} 궁합,<br />지금 확인해 볼래요?</h2>
      <FaceMatchClient invite={{ key: inv.key as AnimalKey, rel: inv.rel as "friend" | "lover" }} />
    </main>
  );
}

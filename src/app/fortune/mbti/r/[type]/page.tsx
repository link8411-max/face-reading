import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MbtiDailyShared from "@/components/mbti/MbtiDailyShared";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import { isMbti } from "@/lib/mbti/compat";
import { parseMbtiDailyKey, SITE } from "@/lib/shareLinks";

type Props = { params: Promise<{ type: string }> };

// 친구가 보낸 오늘의 MBTI 운세 (검색 제외, 사이트맵 제외). 미리보기 문구·이미지에는 날짜를 넣지 않는다
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = parseMbtiDailyKey((await params).type);
  if (!t) return {};
  const title = `친구의 오늘 ${t} 운세가 도착했어요. 너는 무슨 유형이야?`;
  const description = "MBTI만 고르면 나의 오늘 운세도 바로 볼 수 있어요.";
  const image = `${SITE}/api/og/result?kind=mbti-daily&type=${t.toLowerCase()}`;
  return {
    title: `${title} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/fortune/mbti` },
    openGraph: { title, description, url: `${SITE}/fortune/mbti/r/${t.toLowerCase()}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function MbtiDailySharedPage({ params }: Props) {
  const key = (await params).type;
  const t = parseMbtiDailyKey(key);
  if (!t) redirect(isMbti(key.toUpperCase()) ? `/fortune/mbti/r/${key.toLowerCase()}` : "/fortune/mbti");
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker test="mbti_daily" resultId={t} />
      <MbtiDailyShared type={t} />
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MatchCalculator from "@/components/mbti/MatchCalculator";
import { mbtiShared, ogImageUrl, SITE } from "@/lib/shareLinks";
import type { MbtiType } from "@/lib/mbti/compat";

type Props = { params: Promise<{ pair: string }> };

const parse = (pair: string) => {
  const [a = "", b = ""] = pair.split("-");
  return mbtiShared(a, b);
};

// 친구가 보낸 MBTI 궁합 링크: 결과 문구 미리보기, 검색 제외(계산기 /mbti/match는 정적·검색 노출 그대로)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = parse((await params).pair);
  if (!m) return {};
  const image = ogImageUrl("mbti", m.a, null, m.b);
  const description = "두 MBTI를 고르면 연애·친구·직장 궁합 점수를 알려 드려요.";
  return {
    title: `${m.phrase} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/mbti/match` },
    openGraph: { title: m.phrase, description, url: `${SITE}${m.path}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: m.phrase }] },
    twitter: { card: "summary_large_image", title: m.phrase, description, images: [image] },
  };
}

export default async function MbtiSharePage({ params }: Props) {
  const m = parse((await params).pair);
  if (!m) redirect("/mbti/match");
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="font-serif text-3xl font-bold">MBTI 궁합</h1>
      </header>
      <MatchCalculator initial={{ a: m.a as MbtiType, b: m.b as MbtiType, fromShare: true }} />
    </div>
  );
}

import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "오늘의 MBTI 운세 | 16유형 오늘 하루 무료 – 운명을 읽다";
const DESCRIPTION = "MBTI만 고르면 오늘의 한마디와 일·연애·관계 운, 행운의 색과 시간을 알려 드려요. 생년월일 없이, 가입 없이 무료로 매일 자정에 바뀌어요.";
const OG_IMAGE = "/api/og?title=%EC%98%A4%EB%8A%98%EC%9D%98%20MBTI%20%EC%9A%B4%EC%84%B8&subtitle=16%EC%9C%A0%ED%98%95%20%EC%98%A4%EB%8A%98%20%ED%95%98%EB%A3%A8";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "MBTI 운세, 오늘의 MBTI 운세, MBTI 오늘 운세, INFP 운세, ENFP 운세, MBTI 일일운세, 무료 운세",
  alternates: { canonical: "https://unse-ai.com/fortune/mbti" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://unse-ai.com/fortune/mbti", type: "website", locale: "ko_KR", siteName: "운명을 읽다", images: [{ url: OG_IMAGE, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "오늘의 MBTI 운세",
  description: "MBTI 16유형별 오늘의 운세",
  url: "https://unse-ai.com/fortune/mbti",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
      <PageGuide route="/fortune/mbti" />
    </>
  );
}

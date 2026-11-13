import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "무료 AI 관상 테스트 | 사진 한 장으로 보는 관상 – 운명을 읽다";
const DESCRIPTION = "사진 한 장으로 보는 무료 관상. 눈·코·입·얼굴형으로 재물운·연애운과 초년·중년·말년운을 풀어요. 가입 없이, 사진은 저장하지 않아요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "AI 관상 테스트, 무료 관상 테스트, 무료 관상, AI 관상, 관상 분석, 얼굴 관상, 관상 보기, 관상 테스트, 얼굴 분석, 운세",
  alternates: {
    canonical: "https://unse-ai.com/face2",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/face2",
    images: [
      {
        url: "/api/og?title=무료%20관상%20분석&subtitle=얼굴로%20보는%20운세",
        width: 1200,
        height: 630,
        alt: "무료 관상 분석",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og?title=무료%20관상%20분석&subtitle=얼굴로%20보는%20운세"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "무료 관상 분석",
  "description": "얼굴 사진으로 보는 무료 AI 관상 분석 서비스",
  "url": "https://unse-ai.com/face2",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "운명을 읽다",
      "item": "https://unse-ai.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "무료 관상 분석",
      "item": "https://unse-ai.com/face2"
    }
  ]
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
      <PageGuide route="/face2" />
    </>
  );
}

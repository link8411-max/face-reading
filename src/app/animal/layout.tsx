import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "동물상 테스트 | 고양이상? 여우상? 남녀 따로 분석 – 운명을 읽다";
const DESCRIPTION = "강아지상·고양이상·여우상 등 8가지 중 나는 무슨 상일까? 남녀 기준을 따로 두고 얼굴 사진 한 장을 분석해요. 가입 없이, 사진은 저장하지 않아요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "동물상 테스트, 동물상, 강아지상, 고양이상, 여우상, 곰상, 토끼상, 사슴상, 호랑이상, 독수리상, 무료 테스트, 얼굴 분석",
  alternates: {
    canonical: "https://unse-ai.com/animal",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    images: [{ url: "/api/og?title=동물상%20테스트&subtitle=나는%20어떤%20동물을%20닮았을까?", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og?title=동물상%20테스트&subtitle=나는%20어떤%20동물을%20닮았을까?"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "동물상 테스트",
  "description": "AI가 분석하는 당신의 동물상",
  "url": "https://unse-ai.com/animal",
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
      "name": "동물상 테스트",
      "item": "https://unse-ai.com/animal"
    }
  ]
};

export default function AnimalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <PageGuide route="/animal" />
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "삼국지 닮은꼴 찾기 | 나는 어떤 영웅을 닮았을까? - 운명을 읽다",
  description: "AI가 당신의 얼굴을 분석하여 삼국지 최고의 영웅들과 비교해 드립니다. 제갈량, 조조, 유비 중 당신과 가장 닮은 인물은 누구일까요? 무료 닮은꼴 테스트!",
  keywords: "삼국지 닮은꼴, 삼국지 테스트, 삼국지 얼굴, AI 얼굴 분석, 삼국지 인물, 제갈량, 조조, 유비, 관우, 장비, 무료 테스트",
  alternates: {
    canonical: "https://unse-ai.com/samguk",
  },
  openGraph: {
    title: "삼국지 닮은꼴 찾기 | 운명을 읽다",
    description: "나는 어떤 삼국지 영웅과 닮았을까? AI가 얼굴을 분석해서 삼국지 인물과 비교합니다. 능력치와 성격까지 확인하세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/samguk",
    images: [{ url: "/api/og?title=삼국지%20닮은꼴&subtitle=나는%20어떤%20영웅?&icon=⚔️", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=삼국지%20닮은꼴&subtitle=나는%20어떤%20영웅?&icon=⚔️"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "삼국지 닮은꼴 테스트",
  "description": "AI가 분석하는 삼국지 영웅 닮은꼴 테스트",
  "url": "https://unse-ai.com/samguk",
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
      "name": "삼국지 닮은꼴",
      "item": "https://unse-ai.com/samguk"
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
    </>
  );
}

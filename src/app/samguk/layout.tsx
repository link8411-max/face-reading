import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 신년운세 & 토정비결 | 운명을 읽다",
  description: "2026년 병오년 신년운세를 사주팔자와 토정비결로 확인하세요! 음력 생년월일로 총운, 재물운, 애정운, 직장운, 건강운을 상세하게 알려드리는 무료 운세 서비스입니다.",
  keywords: "2026 운세, 2026년 운세, 신년운세, 병오년, 사주, 사주팔자, 토정비결, 무료운세, 띠별운세, 2026년 무료운세",
  alternates: {
    canonical: "https://face-reading.vercel.app/samguk",
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

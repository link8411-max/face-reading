import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 신년운세 & 토정비결 | 운명을 읽다",
  description: "2026년 병오년 신년운세를 사주팔자와 토정비결로 확인하세요! 음력 생년월일로 총운, 재물운, 애정운, 직장운, 건강운을 상세하게 알려드리는 무료 운세 서비스입니다.",
  keywords: "2026 운세, 2026년 운세, 신년운세, 병오년, 사주, 사주팔자, 토정비결, 무료운세, 띠별운세, 2026년 무료운세",
  alternates: {
    canonical: "https://face-reading.vercel.app/fortune",
  },
  openGraph: {
    title: "2026 신년운세 | 운명을 읽다",
    description: "2026년 병오년 신년운세를 사주팔자로 확인하세요! 음력 생년월일로 총운, 재물운, 애정운을 상세하게 알려드립니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://facetest.ai/fortune",
    images: [{ url: "/api/og?title=2026%20신년운세&subtitle=병오년%20새해%20운세&icon=🐍", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=2026%20신년운세&subtitle=병오년%20새해%20운세&icon=🐍"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "2026 무료 신년운세",
  "description": "2026년 병오년 신년운세와 토정비결 무료 분석",
  "url": "https://facetest.ai/fortune",
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
      "item": "https://facetest.ai"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "2026 신년운세",
      "item": "https://facetest.ai/fortune"
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

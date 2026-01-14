import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "무료 AI 관상 분석 | 얼굴로 보는 운세 - 운명을 읽다",
  description: "얼굴 사진으로 보는 무료 AI 관상 분석! 눈, 코, 입, 얼굴형으로 초년운·중년운·말년운과 재물운, 애정운을 확인하세요. 정밀한 AI 관상 분석이 무료!",
  keywords: "무료 관상, AI 관상, 관상 분석, 얼굴 관상, 관상 보기, 관상 테스트, 얼굴 분석, 운세, 무료 관상 테스트",
  alternates: {
    canonical: "https://face-reading.vercel.app/face2",
  },
  openGraph: {
    title: "무료 관상 분석 | 운명을 읽다",
    description: "얼굴 사진으로 보는 무료 관상 분석! 눈, 코, 입, 얼굴형으로 초년운·중년운·말년운과 재물운, 애정운을 확인하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://face-reading.vercel.app/face2",
    images: [
      {
        url: "/api/og?title=무료%20관상%20분석&subtitle=얼굴로%20보는%20운세&icon=👤",
        width: 1200,
        height: 630,
        alt: "무료 관상 분석",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "무료 관상 분석 | 운명을 읽다",
    description: "얼굴 사진으로 보는 무료 관상 분석!",
    images: ["/api/og?title=무료%20관상%20분석&subtitle=얼굴로%20보는%20운세&icon=👤"],
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
    </>
  );
}

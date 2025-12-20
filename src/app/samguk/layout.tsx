import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "삼국지 닮은꼴 찾기 | 운명을 읽다",
  description: "나는 어떤 삼국지 영웅과 닮았을까? AI가 얼굴을 분석해서 제갈량, 조조, 유비, 관우 등 삼국지 인물과 비교합니다. 능력치와 성격까지 확인하세요!",
  keywords: "삼국지 닮은꼴, 삼국지 테스트, 삼국지 얼굴, AI 얼굴 분석, 삼국지 인물, 제갈량, 조조, 유비, 관우, 장비",
  alternates: {
    canonical: "https://face-reading.vercel.app/samguk",
  },
  openGraph: {
    title: "삼국지 닮은꼴 찾기 | 운명을 읽다",
    description: "나는 어떤 삼국지 영웅과 닮았을까? AI가 얼굴을 분석해서 삼국지 인물과 비교합니다. 능력치와 성격까지 확인하세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://face-reading.vercel.app/samguk",
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
  "url": "https://face-reading.vercel.app/samguk",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}

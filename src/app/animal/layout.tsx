import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "동물상 테스트 | 나는 어떤 동물을 닮았을까? - 운명을 읽다",
  description: "AI가 분석하는 나의 동물상! 강아지상, 고양이상, 여우상, 곰상, 토끼상, 사슴상, 호랑이상, 독수리상 중 나는 어떤 동물을 닮았을까요? 무료 동물상 테스트로 확인해보세요.",
  keywords: "동물상 테스트, 동물상, 강아지상, 고양이상, 여우상, 곰상, 토끼상, 사슴상, 호랑이상, 독수리상, 무료 테스트, 얼굴 분석",
  alternates: {
    canonical: "https://face-reading.vercel.app/animal",
  },
  openGraph: {
    title: "동물상 테스트 | 나는 어떤 동물을 닮았을까?",
    description: "AI가 분석하는 나의 동물상! 8가지 동물상 중 나는 어떤 동물을 닮았을까요?",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    images: [{ url: "/api/og?title=동물상%20테스트&subtitle=나는%20어떤%20동물을%20닮았을까?&icon=🦊", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "동물상 테스트 | 나는 어떤 동물을 닮았을까?",
    description: "AI가 분석하는 나의 동물상! 8가지 동물상 중 나는 어떤 동물을 닮았을까요?",
    images: ["/api/og?title=동물상%20테스트&subtitle=나는%20어떤%20동물을%20닮았을까?&icon=🦊"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "동물상 테스트",
  "description": "AI가 분석하는 나의 동물상 테스트",
  "url": "https://face-reading.vercel.app/animal",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
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
      {children}
    </>
  );
}

import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";

export const metadata: Metadata = {
  title: "오늘의 운세 무료 | 태어난 해로 보는 오늘 하루 – 운명을 읽다",
  description: "태어난 해만 고르면 오늘 일진과 내 띠의 관계로 별점·한마디, 재물·연애·일·건강운, 행운의 색과 시간을 알려 드려요. 매일 자정에 바뀌어요.",
  keywords: "오늘의 운세, 일일운세, 띠별 운세, 매일 운세, 무료 운세, 행운의 시간, 행운의 색, 12띠 운세",
  alternates: {
    canonical: "https://unse-ai.com/fortune/daily",
  },
  openGraph: {
    title: "오늘의 운세 무료 | 태어난 해로 보는 오늘 하루 – 운명을 읽다",
    description: "태어난 해만 고르면 오늘 일진으로 별점·한마디와 재물·연애·일·건강운, 행운의 색과 시간을 알려 드려요.",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/fortune/daily",
    images: [{ url: "/api/og?title=오늘의%20운세&subtitle=하루를%20시작하는%20운세&cast=sajaF", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=오늘의%20운세&subtitle=하루를%20시작하는%20운세&cast=sajaF"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "오늘의 운세",
  "description": "띠별 오늘의 운세",
  "url": "https://unse-ai.com/fortune/daily",
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
      <PageGuide route="/fortune/daily" />
    </>
  );
}

import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";
import HideOnPaths from "@/components/HideOnPaths";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "나는 삼국지 속 누구? 76명 영웅 닮은꼴 테스트 – 운명을 읽다";
const DESCRIPTION = "얼굴 사진 한 장으로 찾는 나와 닮은 삼국지 장수. 칼퇴력·꼰대력 회사생활 스탯과 나를 지켜줄 장수까지. 가입 없이, 사진은 저장하지 않아요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "삼국지 닮은꼴, 삼국지 테스트, 삼국지 얼굴, AI 얼굴 분석, 삼국지 인물, 제갈량, 조조, 유비, 관우, 장비, 무료 테스트",
  alternates: {
    canonical: "https://unse-ai.com/samguk",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/samguk",
    images: [{ url: "/api/og?title=삼국지%20닮은꼴&subtitle=나는%20어떤%20영웅?", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=삼국지%20닮은꼴&subtitle=나는%20어떤%20영웅?"],
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
      {/* 일기토 아래에는 일기토 안내(/samguk/duel layout)만 보인다 */}
      <HideOnPaths prefixes={["/samguk/duel"]}>
        <PageGuide route="/samguk" />
      </HideOnPaths>
    </>
  );
}

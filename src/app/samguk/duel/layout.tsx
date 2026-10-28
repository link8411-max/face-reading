import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";
import HideOnPaths from "@/components/HideOnPaths";

// 검색 결과 제목·설명 (길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "삼국지 일기토 미니게임 – 관우·여포 로그라이크 – 운명을 읽다";
const DESCRIPTION = "삼국지3 감성 도트 일기토. 장수 하나로 시작해 적장을 영입하고 여포까지 도전하는 무료 로그라이크 웹게임. 설치 없이 바로 플레이.";
const URL = "https://unse-ai.com/samguk/duel";
const OG_IMAGE = "/api/og?title=삼국지%20일기토&subtitle=여포까지%2036웨이브";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "삼국지 일기토, 삼국지 게임, 로그라이크, 도트 게임, 무료 웹게임, 관우, 여포, 삼국지 미니게임",
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "삼국지 일기토",
  "description": DESCRIPTION,
  "url": URL,
  "genre": ["로그라이크", "턴제 전략"],
  "gamePlatform": "Web",
  "applicationCategory": "Game",
  "operatingSystem": "Web",
  "inLanguage": "ko",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "운명을 읽다", "item": "https://unse-ai.com" },
    { "@type": "ListItem", "position": 2, "name": "삼국지 닮은꼴", "item": "https://unse-ai.com/samguk" },
    { "@type": "ListItem", "position": 3, "name": "삼국지 일기토", "item": URL },
  ],
};

// 장수 페이지·공유 페이지는 자기 메타·구조화 데이터·본문이 있어 게임 첫 화면에서만 안내문을 붙인다
const OWN_PAGES = ["/samguk/duel/generals", "/samguk/duel/r"];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HideOnPaths prefixes={OWN_PAGES}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <PageGuide route="/samguk/duel" />
      </HideOnPaths>
    </>
  );
}

import PageGuide from "@/components/PageGuide";

const DESCRIPTION = "삼국지3 감성 도트 일기토. 장수 하나로 시작해 적장을 영입하고 여포까지 도전하는 무료 로그라이크 웹게임. 설치 없이 바로 플레이.";
const URL = "https://unse-ai.com/samguk/duel";

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

// 게임 첫 화면(/samguk/duel)에만 VideoGame·BreadcrumbList와 안내문을 붙인다. 장수·공유 페이지는 자기 것을 가진다
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
      <PageGuide route="/samguk/duel" />
    </>
  );
}

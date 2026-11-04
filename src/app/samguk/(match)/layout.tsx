import PageGuide from "@/components/PageGuide";
import VideoStrip from "@/components/videos/VideoStrip";
import { getChannelVideos } from "@/lib/videos/fetch";

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

// 닮은꼴 테스트(/samguk), 공유 착지, 우리 팀 삼국지에만 붙는 구조화 데이터와 안내문. 일기토(/samguk/duel)는 따로 가진다
export default async function Layout({ children }: { children: React.ReactNode }) {
  const videos = await getChannelVideos();
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
      <div className="mx-auto max-w-lg px-[22px]"><VideoStrip videos={videos} /></div>
      <PageGuide route="/samguk" />
    </>
  );
}

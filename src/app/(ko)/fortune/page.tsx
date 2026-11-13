import FortuneClient from "./FortuneClient";
import PageGuide from "@/components/PageGuide";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "2027 무료 신년운세",
  "description": "2027년 정미년 신년운세 무료 사주 분석",
  "url": "https://unse-ai.com/fortune",
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
      "name": "2027 신년운세",
      "item": "https://unse-ai.com/fortune"
    }
  ]
};

// 가이드·구조화 데이터를 layout에 두면 하위 페이지(/fortune/daily, /fortune/2027/*)에도 중첩되므로 page에서 렌더
export default function FortunePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <FortuneClient />
      <PageGuide route="/fortune" />
    </>
  );
}

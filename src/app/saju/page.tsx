import type { Metadata } from "next";
import SajuClient from "./SajuClient";
import PageGuide from "@/components/PageGuide";

const TITLE = "내 사주 풀이 | 네 기둥·십신·대운을 쉬운 말로 – 운명을 읽다";
const DESCRIPTION = "생년월일과 태어난 시간으로 네 기둥, 오행의 균형, 십신, 10년 대운과 올해 흐름을 쉬운 말로 풀어요. 절기 시각 기준으로 계산하고 가입 없이 무료예요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "내 사주, 사주 풀이, 무료 사주, 사주팔자, 만세력, 십신, 대운, 오행, 사주 보기",
  alternates: { canonical: "https://unse-ai.com/saju" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/saju",
    images: [{ url: "/api/og?title=내%20사주%20풀이&subtitle=네%20기둥·십신·대운을%20쉬운%20말로", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og?title=내%20사주%20풀이&subtitle=네%20기둥·십신·대운을%20쉬운%20말로"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "내 사주 풀이",
  description: "생년월일시로 네 기둥·십신·대운을 쉬운 말로 풀어 주는 무료 사주 서비스",
  url: "https://unse-ai.com/saju",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "운명을 읽다", item: "https://unse-ai.com" },
    { "@type": "ListItem", position: 2, name: "내 사주 풀이", item: "https://unse-ai.com/saju" },
  ],
};

export default function SajuPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SajuClient />
      <PageGuide route="/saju" />
    </>
  );
}

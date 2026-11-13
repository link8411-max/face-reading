// 영어 페이지 metadata 도우미: 제목·설명은 src/content/en/pageGuides.ts, canonical은 /en/..., 언어 짝(hreflang)은 languageAlternates.
import type { Metadata } from "next";
import { pageGuides, type EnGuideRoute } from "@/content/en/pageGuides";
import { languageAlternates } from "@/lib/i18n/alternates";
import { localePath } from "@/lib/i18n/locales";

const SITE = "https://unse-ai.com";
const SITE_NAME = "unse-ai.com";

export function enMetadata(route: EnGuideRoute, ogTitle: string): Metadata {
  const g = pageGuides[route];
  const url = SITE + localePath("en", route);
  const title = `${g.heading} | ${SITE_NAME}`;
  const og = `/api/og?title=${encodeURIComponent(ogTitle)}&subtitle=${encodeURIComponent("unse-ai.com")}`;
  return {
    title,
    description: g.summary,
    alternates: { canonical: url, languages: languageAlternates(route) },
    openGraph: { title, description: g.summary, url, type: "website", locale: "en_US", siteName: SITE_NAME, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: g.summary, images: [og] },
  };
}

/** SoftwareApplication + BreadcrumbList 구조화 데이터 (영어판) */
export function enJsonLd(route: EnGuideRoute, name: string): object[] {
  const g = pageGuides[route];
  const url = SITE + localePath("en", route);
  return [
    { "@context": "https://schema.org", "@type": "SoftwareApplication", name, description: g.summary, url, inLanguage: "en", applicationCategory: "EntertainmentApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE}/en` },
      { "@type": "ListItem", position: 2, name, item: url },
    ] },
  ];
}

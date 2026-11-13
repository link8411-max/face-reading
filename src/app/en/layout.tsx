import type { Metadata } from "next";
import SiteHead from "@/components/SiteHead";
import SiteShell from "@/components/SiteShell";
import { pageGuides } from "@/content/en/pageGuides";
import { languageAlternates } from "@/lib/i18n/alternates";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { LOCALE_HTML_LANG } from "@/lib/i18n/locales";
import { FONT_CLASS } from "@/lib/siteFonts";
import "../globals.css";

// 영어판 루트 레이아웃. 문구는 src/content/en/* 에서만 가져온다.
const SITE_NAME = "unse-ai.com";
const HOME = pageGuides["/"];
const TITLE = `${HOME.heading} | ${SITE_NAME}`;
const DESCRIPTION = HOME.summary;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    images: [{ url: "/api/og?title=Read%20your%20fate&subtitle=Face%20reading%20%26%20animal%20face%20test", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og?title=Read%20your%20fate&subtitle=Face%20reading%20%26%20animal%20face%20test"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://unse-ai.com/en", languages: languageAlternates("/") },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: DESCRIPTION,
  url: "https://unse-ai.com/en",
  inLanguage: "en",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function EnRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={LOCALE_HTML_LANG.en}>
      <head>
        <SiteHead appName={SITE_NAME} jsonLd={jsonLd} />
      </head>
      <body className={`${FONT_CLASS} font-sans antialiased bg-paper text-ink`}>
        <LocaleProvider locale="en">
          <SiteShell locale="en">{children}</SiteShell>
        </LocaleProvider>
      </body>
    </html>
  );
}

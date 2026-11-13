import type { Metadata } from "next";
import SiteHead from "@/components/SiteHead";
import SiteShell from "@/components/SiteShell";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { FONT_CLASS } from "@/lib/siteFonts";
import "../globals.css";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "무료 AI 관상·동물상 테스트와 사주 풀이 – 운명을 읽다";
const DESCRIPTION = "사진 한 장으로 보는 무료 AI 관상·동물상 테스트와 생년월일로 보는 내 사주 풀이. 가입 없이, 사진은 저장하지 않아요. 2027 신년운세와 오늘의 운세도 무료예요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "2027 신년운세, 오늘의 운세, 띠별 운세, 사주팔자, AI 관상, 관상 테스트, 동물상 테스트, 얼굴 테스트, 무료 운세, 정미년 운세, 삼국지 닮은꼴, 관상 분석",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    images: [{ url: "/api/og?title=운명을%20읽다&subtitle=2027%20신년운세%20%26%20AI%20관상", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og?title=운명을%20읽다&subtitle=2027%20신년운세%20%26%20AI%20관상"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://unse-ai.com",
  },
  verification: {
    other: {
      "naver-site-verification": "83370e21ac5424788768cbcd73b43b0fa3a350db",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "운명을 읽다",
  "description": "무료 AI 관상 분석과 사주팔자 기반 2027년 정미년 신년운세 서비스",
  "url": "https://unse-ai.com",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "featureList": [
    "AI 관상 분석",
    "동물상 테스트",
    "삼국지 닮은꼴 테스트",
    "2027년 신년운세",
    "띠별 오늘의 운세"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <SiteHead appName="운명을읽다" jsonLd={jsonLd} />
      </head>
      <body
        className={`${FONT_CLASS} font-sans antialiased bg-paper text-ink`}
      >
        <LocaleProvider locale="ko">
          <SiteShell locale="ko">{children}</SiteShell>
        </LocaleProvider>
      </body>
    </html>
  );
}

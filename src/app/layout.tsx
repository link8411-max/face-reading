import type { Metadata } from "next";
import { Gowun_Batang, Noto_Sans_KR, Silkscreen } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";
import { CATEGORIES } from "@/content/navigation";
import "./globals.css";

// 한글 본문·제목 글꼴 (Korean 글리프는 unicode-range로 필요한 만큼만 받는다)
const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

// 삼국지 결과 카드의 픽셀 글씨 (영문·숫자만)
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "운명을 읽다 | 2027 무료 신년운세 & AI 관상 테스트",
  description: "2027 무료 신년운세와 오늘의 운세, AI 관상·동물상·삼국지 닮은꼴 테스트로 나의 운명을 확인해 보세요. 사진은 브라우저 안에서만 분석해요.",
  keywords: "2027 신년운세, 오늘의 운세, 띠별 운세, 사주팔자, AI 관상, 관상 테스트, 동물상 테스트, 얼굴 테스트, 무료 운세, 정미년 운세, 삼국지 닮은꼴, 관상 분석",
  openGraph: {
    title: "운명을 읽다 | 2027 무료 신년운세 & AI 관상 테스트",
    description: "2027년 정미년 신년운세와 오늘의 운세, AI 관상·동물상·삼국지 닮은꼴 테스트를 지금 바로 무료로 확인하세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    images: [{ url: "/api/og?title=운명을%20읽다&subtitle=2027%20신년운세%20%26%20AI%20관상&icon=☯", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "운명을 읽다 | 2027 무료 신년운세 & AI 관상 테스트",
    description: "2027년 정미년 신년운세와 오늘의 운세, AI 관상·동물상·삼국지 닮은꼴 테스트를 지금 바로 무료로 확인하세요!",
    images: ["/api/og?title=운명을%20읽다&subtitle=2027%20신년운세%20%26%20AI%20관상&icon=☯"],
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
        {/* PWA 메타 태그 */}
        <meta name="application-name" content="운명을읽다" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="운명을읽다" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#C41E3A" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9670928093323234"
          crossOrigin="anonymous"></script>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* 서비스 워커 등록 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(err) {
                      console.log('SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${notoSans.variable} ${gowunBatang.variable} ${silkscreen.variable} font-sans antialiased bg-paper text-ink`}
      >
        {/* 하단 탭바(h-16)에 내용이 가리지 않도록 아래 여백 */}
        <div className="flex flex-col min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-stone-100 border-t border-stone-200 py-8 px-4 no-screenshot">
            <div className="max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-6 mb-8">
                {CATEGORIES.filter((c) => c.items.length > 0).map((c) => (
                  <div key={c.key} className="space-y-3">
                    <p className="text-vermilion font-bold text-sm"><Link href={c.href}>{c.title}</Link></p>
                    <ul className="text-sm space-y-2 text-stone-600">
                      {c.items.map((i) => (
                        <li key={i.href}><Link href={i.href} className="hover:text-vermilion">{i.title}</Link></li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="space-y-3 col-span-2 border-t pt-6">
                  <p className="text-stone-400 font-bold text-sm">정보</p>
                  <ul className="text-sm space-y-2 text-stone-500">
                    <li><Link href="/about" className="hover:text-vermilion">서비스 소개</Link></li>
                    <li><Link href="/privacy" className="hover:text-vermilion">개인정보처리방침</Link></li>
                  </ul>
                </div>
              </div>
              <div className="text-center pt-6 border-t border-stone-200">
                <p className="text-xs text-stone-400">© 2026 운명을 읽다. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        <BottomTabBar />
        <Analytics />
      </body>
    </html>
  );
}

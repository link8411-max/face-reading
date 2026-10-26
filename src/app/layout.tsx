import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-stone-100 border-t border-stone-200 py-8 px-4 no-screenshot">
            <div className="max-w-lg mx-auto">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <h4 className="text-[#C41E3A] font-bold text-sm">관상/운세</h4>
                  <ul className="text-sm space-y-2 text-stone-600">
                    <li><Link href="/face2" className="hover:text-[#C41E3A]">무료 관상 분석</Link></li>
                    <li><Link href="/fortune" className="hover:text-[#C41E3A]">2027 신년운세</Link></li>
                    <li><Link href="/fortune/daily" className="hover:text-[#C41E3A]">오늘의 운세</Link></li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[#C41E3A] font-bold text-sm">이색 테스트</h4>
                  <ul className="text-sm space-y-2 text-stone-600">
                    <li><Link href="/samguk" className="hover:text-[#C41E3A]">삼국지 닮은꼴</Link></li>
                    <li><Link href="/animal" className="hover:text-[#C41E3A]">동물상 테스트</Link></li>
                  </ul>
                </div>
                <div className="space-y-3 col-span-2 md:col-span-1 border-t pt-6 md:border-0 md:pt-0">
                  <h4 className="text-stone-400 font-bold text-sm uppercase">Info</h4>
                  <ul className="text-sm space-y-2 text-stone-500">
                    <li><Link href="/about" className="hover:text-[#C41E3A]">서비스 소개</Link></li>
                    <li><Link href="/privacy" className="hover:text-[#C41E3A]">개인정보처리방침</Link></li>
                  </ul>
                </div>
              </div>
              <div className="text-center pt-6 border-t border-stone-200">
                <p className="text-xs text-stone-400">© 2026 운명을 읽다. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}

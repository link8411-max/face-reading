import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
  title: "운명을 읽다 | 무료 AI 관상 분석 & 2026 신년운세",
  description: "무료 AI 관상 분석과 사주팔자 기반 2026년 병오년 신년운세! 얼굴로 보는 초년·중년·말년운, 음력 생년월일로 보는 토정비결. 삼국지 닮은꼴 테스트도 해보세요.",
  keywords: "무료 관상, AI 관상, 관상 분석, 신년운세, 2026운세, 2026 토정비결, 사주, 사주팔자, 병오년, 무료운세, 토정비결, 얼굴분석, 오늘의 운세, 띠별 운세, 삼국지 닮은꼴",
  openGraph: {
    title: "운명을 읽다 | 무료 AI 관상 분석 & 2026 신년운세",
    description: "무료 AI 관상 분석과 사주팔자 기반 2026년 병오년 신년운세를 확인하세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://face-reading.vercel.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "운명을 읽다",
  "description": "무료 AI 관상 분석과 사주팔자 기반 2026년 병오년 신년운세 서비스",
  "url": "https://face-reading.vercel.app",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "featureList": [
    "AI 관상 분석",
    "2026년 신년운세",
    "오늘의 운세",
    "삼국지 닮은꼴 테스트"
  ]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "관상이란 무엇인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "관상(觀相)은 사람의 얼굴 생김새를 보고 성격, 운명, 건강 등을 판단하는 동양의 전통 학문입니다. 눈, 코, 입, 이마, 턱 등 각 부위의 특징을 분석하여 초년운, 중년운, 말년운을 예측합니다."
      }
    },
    {
      "@type": "Question",
      "name": "AI가 어떻게 얼굴을 분석하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "최신 AI 기술(Google Gemini)을 활용하여 업로드된 얼굴 사진의 이목구비를 분석합니다. 전통 관상학의 기준을 바탕으로 각 부위의 특징을 파악하고, 종합적인 관상 해석을 제공합니다."
      }
    },
    {
      "@type": "Question",
      "name": "2026년 병오년 운세는 어떻게 보나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "음력 생년월일시를 입력하면 사주팔자와 천간지지를 분석하여 2026년 병오년(丙午年) 운세를 확인할 수 있습니다. 총운, 재물운, 직장운, 건강운, 애정운을 상세하게 알려드립니다."
      }
    },
    {
      "@type": "Question",
      "name": "AI 관상과 무료 관상의 차이는 무엇인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "무료 관상은 얼굴 인식 라이브러리로 즉시 분석하여 빠른 결과를 제공하며 무제한 이용 가능합니다. AI 관상은 Google Gemini AI가 더 정밀하게 분석하여 개인화된 결과를 제공하며 하루 1회 무료입니다."
      }
    },
    {
      "@type": "Question",
      "name": "무료인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "네, 모든 서비스는 무료입니다. 무료 관상 분석은 무제한, AI 관상 분석은 하루 1회 무료로 이용하실 수 있습니다. 오늘의 운세, 신년운세도 무료입니다."
      }
    }
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

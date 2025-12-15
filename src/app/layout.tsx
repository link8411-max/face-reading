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
  title: "운명을 읽다 | AI 관상 & 2026 신년운세",
  description: "AI 관상 분석과 사주팔자 기반 2026년 병오년 신년운세! 얼굴로 보는 초년·중년·말년운, 음력 생년월일로 보는 무료 운세.",
  keywords: "관상, AI 관상, 신년운세, 2026운세, 사주, 사주팔자, 병오년, 무료운세, 토정비결, 얼굴분석",
  openGraph: {
    title: "운명을 읽다 | AI 관상 & 2026 신년운세",
    description: "AI 관상 분석과 사주팔자 기반 2026년 신년운세를 무료로 확인하세요!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

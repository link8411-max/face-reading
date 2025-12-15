import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AI 관상 테스트 | 얼굴로 보는 내 성격",
  description: "AI가 당신의 얼굴을 분석해 숨겨진 성격과 운명을 알려드립니다. 무료 관상 테스트!",
  keywords: "관상, AI 관상, 얼굴 분석, 성격 테스트, 무료 관상",
  openGraph: {
    title: "AI 관상 테스트 | 얼굴로 보는 내 성격",
    description: "AI가 당신의 얼굴을 분석해 숨겨진 성격과 운명을 알려드립니다.",
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
      </body>
    </html>
  );
}

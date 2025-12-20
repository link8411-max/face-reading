import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 관상 분석 | 운명을 읽다",
  description: "Google Gemini AI가 분석하는 정밀 관상! 얼굴 사진으로 성격, 운세, 재물운, 애정운을 상세하게 분석합니다. 하루 1회 무료 이용.",
  keywords: "AI 관상, 관상 분석, 인공지능 관상, 얼굴 분석, 운세, 재물운, 애정운, AI 운세, Google Gemini",
  alternates: {
    canonical: "https://face-reading.vercel.app/face",
  },
  openGraph: {
    title: "AI 관상 분석 | 운명을 읽다",
    description: "Google Gemini AI가 분석하는 정밀 관상! 얼굴 사진으로 성격, 운세, 재물운, 애정운을 상세하게 분석합니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://face-reading.vercel.app/face",
    images: [{ url: "/api/og?title=AI%20관상%20분석&subtitle=인공지능이%20읽는%20당신의%20얼굴&icon=🔮", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=AI%20관상%20분석&subtitle=인공지능이%20읽는%20당신의%20얼굴&icon=🔮"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘의 운세 | 운명을 읽다",
  description: "오늘의 운세를 띠별로 확인하세요! 출생년도로 간편하게 오늘의 운세, 행운의 시간, 행운의 색을 알려드립니다. 매일 업데이트되는 무료 일일운세!",
  keywords: "오늘의 운세, 일일운세, 띠별 운세, 매일 운세, 무료 운세, 행운의 시간, 행운의 색, 12띠 운세",
  openGraph: {
    title: "오늘의 운세 | 운명을 읽다",
    description: "오늘의 운세를 띠별로 확인하세요! 출생년도로 간편하게 오늘의 운세, 행운의 시간, 행운의 색을 알려드립니다.",
    type: "website",
    locale: "ko_KR",
    url: "https://face-reading.vercel.app/fortune/daily",
    images: [{ url: "/api/og?title=오늘의%20운세&subtitle=하루를%20시작하는%20운세&icon=✨", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=오늘의%20운세&subtitle=하루를%20시작하는%20운세&icon=✨"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

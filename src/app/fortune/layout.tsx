import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 신년운세 | 운명을 읽다",
  description: "2026년 병오년 신년운세를 사주팔자로 확인하세요! 음력 생년월일로 총운, 재물운, 애정운, 직장운, 건강운을 상세하게 알려드립니다. 토정비결 기반 무료 운세!",
  keywords: "2026 운세, 2026년 운세, 신년운세, 병오년, 사주, 사주팔자, 토정비결, 무료운세, 띠별운세, 재물운, 애정운, 직장운",
  openGraph: {
    title: "2026 신년운세 | 운명을 읽다",
    description: "2026년 병오년 신년운세를 사주팔자로 확인하세요! 음력 생년월일로 총운, 재물운, 애정운을 상세하게 알려드립니다.",
    type: "website",
    locale: "ko_KR",
    url: "https://face-reading.vercel.app/fortune",
    images: [{ url: "/api/og?title=2026%20신년운세&subtitle=병오년%20새해%20운세&icon=🐍", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=2026%20신년운세&subtitle=병오년%20새해%20운세&icon=🐍"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

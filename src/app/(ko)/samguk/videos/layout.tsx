import type { Metadata } from "next";

const TITLE = "삼국지 쇼츠 모음 | 1분 삼국지 한 장면 – 운명을 읽다";
const DESCRIPTION = "1분이면 끝나는 삼국지 한 장면. 정사와 연의가 어떻게 다른지, 인물별로 골라 쇼츠로 봐요.";
const IMAGE = "/api/og?title=쇼츠로 보는 삼국지";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://unse-ai.com/samguk/videos" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/samguk/videos",
    images: [{ url: IMAGE, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [IMAGE] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

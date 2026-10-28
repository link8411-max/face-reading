import type { Metadata } from "next";

// 검색 결과 제목·설명 (길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "삼국지 일기토 미니게임 – 관우·여포 로그라이크 – 운명을 읽다";
const DESCRIPTION = "삼국지3 감성 도트 일기토. 장수 하나로 시작해 적장을 영입하고 여포까지 도전하는 무료 로그라이크 웹게임. 설치 없이 바로 플레이.";
const URL = "https://unse-ai.com/samguk/duel";
const OG_IMAGE = "/api/og?title=삼국지%20일기토&subtitle=여포까지%2036웨이브";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "삼국지 일기토, 삼국지 게임, 로그라이크, 도트 게임, 무료 웹게임, 관우, 여포, 삼국지 미니게임",
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
  },
};

// 메타데이터만 둔다. 구조화 데이터·안내문은 (game)/layout.tsx가 게임 첫 화면에만 붙인다
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

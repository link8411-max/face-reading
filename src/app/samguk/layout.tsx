import type { Metadata } from "next";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "삼국지 인물 테스트 | 얼굴로 찾는 닮은 장수 99명 – 운명을 읽다";
const DESCRIPTION = "얼굴 사진 한 장으로 찾는 나와 닮은 삼국지 장수. 칼퇴력·꼰대력 회사생활 스탯과 나를 지켜줄 장수까지. 가입 없이, 사진은 저장하지 않아요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "삼국지 인물 테스트, 삼국지 테스트, 삼국지 장수 테스트, 삼국지 닮은꼴, 삼국지 얼굴, AI 얼굴 분석, 삼국지 인물, 제갈량, 조조, 유비, 관우, 장비, 무료 테스트",
  alternates: {
    canonical: "https://unse-ai.com/samguk",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/samguk",
    images: [{ url: "/api/og?title=삼국지%20닮은꼴&subtitle=나는%20어떤%20영웅?", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=삼국지%20닮은꼴&subtitle=나는%20어떤%20영웅?"],
  },
};

// 메타데이터만 둔다. 구조화 데이터·안내문은 (match)/layout.tsx(닮은꼴)와 duel/layout.tsx(일기토)가 각자 가진다
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

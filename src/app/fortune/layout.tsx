import type { Metadata } from "next";

// 검색 결과 제목·설명 (클릭률 위주, 길이 상한은 tests/seo-snippets.test.tsx). og·트위터도 같은 문구
const TITLE = "2027 신년운세 무료 사주풀이 | 정미년 총운·재물·연애운 – 운명을 읽다";
const DESCRIPTION = "2027년 정미년 신년운세를 사주로 무료로 풀어 드려요. 양력·음력 생년월일로 총운·재물운·애정운·직장운·건강운까지, 가입 없이 바로 확인하세요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: "2027 운세, 2027년 운세, 신년운세, 정미년, 사주, 사주팔자, 무료 사주, 무료운세, 띠별운세, 2027년 무료운세",
  alternates: {
    canonical: "https://unse-ai.com/fortune",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "운명을 읽다",
    url: "https://unse-ai.com/fortune",
    images: [{ url: "/api/og?title=2027%20신년운세&subtitle=정미년%20새해%20운세", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og?title=2027%20신년운세&subtitle=정미년%20새해%20운세"],
  },
};

// 구조화 데이터는 page.tsx에서 렌더한다. layout에 두면 /fortune/daily, /fortune/2027/* 같은 하위 페이지에도 붙는다.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

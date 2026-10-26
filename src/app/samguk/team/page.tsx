import type { Metadata } from "next";
import TeamClient from "@/components/samguk/TeamClient";

export const metadata: Metadata = {
  title: "우리 팀 삼국지 — 팀원 얼굴로 보는 삼국지 세력·역할 | 운명을 읽다",
  description: "팀원 2~6명의 얼굴 사진으로 닮은 삼국지 장수를 찾고 군주·책사·선봉장 역할과 팀의 기운, 회사생활 STATUS를 알려 드려요. 사진은 저장되지 않아요.",
  keywords: "우리 팀 삼국지, 삼국지 닮은꼴, 팀 테스트, 회사 동료 테스트, 삼국지 세력",
  alternates: { canonical: "https://unse-ai.com/samguk/team" },
  openGraph: { title: "우리 팀 삼국지 | 운명을 읽다", description: "우리 팀은 위·촉·오 중 어디일까?", url: "https://unse-ai.com/samguk/team", type: "website", locale: "ko_KR", siteName: "운명을 읽다", images: [{ url: "/api/og?title=우리%20팀%20삼국지&subtitle=팀원%20얼굴로%20보는%20세력과%20역할", width: 1200, height: 630 }] },
};

export default function TeamPage() {
  return (
    <main className="mx-auto px-[22px] max-w-lg">
      <header className="pt-5 pb-1"><h1 className="text-sm font-medium text-center">우리 팀 삼국지</h1></header>
      <h2 className="mt-4 font-serif font-bold text-[27px] leading-[1.4] break-keep">우리 팀은<br />삼국지 속 어느 세력?</h2>
      <p className="mt-2.5 mb-5 text-sm text-muted leading-relaxed">팀원 얼굴로 닮은 장수를 찾아 군주·책사·선봉장 역할과 팀의 기운을 알려 드려요.</p>
      <TeamClient />
    </main>
  );
}

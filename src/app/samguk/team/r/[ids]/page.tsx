import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import TeamCard from "@/components/samguk/TeamCard";
import SharedLandingTracker from "@/components/share/SharedLandingTracker";
import { buildTeam } from "@/lib/samguk/team";
import { parseTeam, SITE } from "@/lib/shareLinks";

type Props = { params: Promise<{ ids: string }> };

// 친구가 보낸 우리 팀 삼국지 결과 (별칭 없음, 검색 제외, 사이트맵 제외)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = parseTeam((await params).ids);
  if (!p) return {};
  const team = buildTeam(p.members.map((character) => ({ character })));
  const title = `우리 팀은 ${team.spirit}! 너희 팀은 삼국지 속 누구야?`;
  const image = `${SITE}/api/og/result?kind=team&ids=${p.ids.join("-")}`;
  const description = "팀원 얼굴로 보는 삼국지 세력과 역할. 우리 팀도 만들어 보세요.";
  return {
    title: `${title} | 운명을 읽다`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE}/samguk/team` },
    openGraph: { title, description, url: `${SITE}/samguk/team/r/${p.ids.join("-")}`, siteName: "운명을 읽다", locale: "ko_KR", type: "website", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function TeamSharedPage({ params }: Props) {
  const p = parseTeam((await params).ids);
  if (!p) redirect("/samguk/team");
  const team = buildTeam(p.members.map((character) => ({ character })));
  const lord = team.members.find((m) => m.role === "군주")!;
  return (
    <main className="max-w-lg mx-auto px-[22px] pt-8 pb-10">
      <SharedLandingTracker test="team_samguk" resultId={`${lord.character.id}_${team.members.length}`} />
      <p className="text-sm text-muted mb-3">친구네 팀 결과</p>
      <TeamCard team={team} />
      <Link href="/samguk/team" className="mt-5 h-[56px] rounded-full flex items-center justify-center bg-ink text-paper text-base font-medium">우리 팀도 만들어 보기</Link>
      <p className="mt-3 text-xs text-center text-muted">사진은 내 폰 안에서만 보고 바로 지워요</p>
    </main>
  );
}

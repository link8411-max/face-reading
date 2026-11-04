import type { Metadata } from "next";
import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import FactionMap from "@/components/people/FactionMap";
import HubRelationList from "@/components/people/HubRelationList";
import PeopleBrowser from "@/components/people/PeopleBrowser";
import { Icon } from "@/components/icons";
import { factionLabel } from "@/components/people/PersonHeader";
import { PEOPLE_IDS } from "@/content/samgukPeople";
import { characterById } from "@/lib/people/characters";
import { hubCards } from "@/lib/people/hubCards";
import { hubRelations } from "@/lib/people/hubRelations";
import { portraitSrc } from "@/lib/people/portrait";
import { factionGroups } from "@/lib/people/relations";

const SITE = "https://unse-ai.com";
const URL = `${SITE}/samguk/people`;
const TITLE = "삼국지 인물 관계도 | 위·촉·오 인물 소개 – 운명을 읽다";
const DESCRIPTION = "위·촉·오 삼국지 인물의 관계도와 열전을 세력별로 모았어요. 의형제·혈연·라이벌 관계를 한눈에 보고 인물 이야기를 읽어 보세요.";
const OG = `/api/og?title=${encodeURIComponent("삼국지 인물 관계도")}&subtitle=${encodeURIComponent("위·촉·오 인물 열전")}`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: URL },
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website", locale: "ko_KR", siteName: "운명을 읽다", url: URL, images: [{ url: OG, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG] },
  };
}

export default async function PeopleHubPage() {
  const cards = hubCards();
  const groups = factionGroups();
  const { within, cross } = hubRelations();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 인물열전", item: URL },
    ],
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto px-[22px] max-w-lg pt-6 pb-12">
        <p className="text-sm font-bold text-accent">삼국지 인물열전</p>
        <h1 className="mt-1 font-serif font-bold text-[27px] leading-[1.3] break-keep">천하를 눌러 영웅을 만나 보세요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted break-keep">
          위·촉·오 삼국지 인물 {PEOPLE_IDS.length}명의 열전과 관계도예요. 지도에서 세력을 누르면 그 세력 인물만 모아 볼 수 있어요.
        </p>

        <PeopleBrowser cards={cards} />

        <nav aria-label="바로가기" className="mt-8 grid grid-cols-2 gap-3">
          <a href="#relations" className="rounded-[22px] border border-line bg-white px-4 py-4 hover:border-accent/50 transition">
            <Icon name="users" className="text-accent" />
            <span className="mt-2 block font-bold">관계도 보기</span>
            <span className="mt-0.5 block text-xs text-muted">세력별 관계도·관계 글</span>
          </a>
          <Link href="/samguk/people/ranking" className="rounded-[22px] border border-line bg-white px-4 py-4 hover:border-accent/50 transition">
            <Icon name="heart" className="text-accent" />
            <span className="mt-2 block font-bold">응원 순위</span>
            <span className="mt-0.5 block text-xs text-muted">가장 응원받는 장수</span>
          </Link>
          <Link href="/samguk/cup" className="col-span-2 rounded-[22px] border border-line bg-white px-4 py-4 hover:border-accent/50 transition">
            <Icon name="shield" className="text-accent" />
            <span className="mt-2 block font-bold">장수 월드컵</span>
            <span className="mt-0.5 block text-xs text-muted">이야기를 읽고 고르는 16강</span>
          </Link>
        </nav>

        <section id="relations" className="mt-10 scroll-mt-6">
          <h2 className="font-serif font-bold text-xl">세력별 관계도</h2>
          <p className="mt-1 text-sm text-muted">세력을 눌러 펼치면 관계도와 인물, 관계 글이 나와요.</p>
          <div className="mt-4 space-y-3">
            {groups.map((g) => {
              const label = factionLabel(g.faction);
              return (
                <details key={g.faction} className="bg-white rounded-[22px] border border-line px-5 py-4">
                  <summary className="cursor-pointer">
                    <h3 className="inline font-serif font-bold text-lg">{label}</h3>
                    <span className="ml-2 text-xs text-muted">{g.ids.length}명</span>
                  </summary>
                <div className="mt-4">
                  <FactionMap ids={g.ids} label={label} />

                  <ul className="mt-5 grid grid-cols-2 gap-2">
                    {g.ids.map((id) => {
                      const c = characterById(id);
                      const src = portraitSrc(id);
                      return (
                        <li key={id}>
                          <Link href={`/samguk/people/${id}`} prefetch={false} className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-3 py-2 hover:border-accent/50 transition">
                            {src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={src} alt={`${c?.name ?? id} 초상`} width={40} height={50} loading="lazy" className="w-10 h-[50px] object-cover rounded-lg border border-line flex-none" />
                            ) : (
                              <span className="w-10 h-[50px] rounded-lg border border-dashed border-line bg-card-2 flex-none" aria-hidden="true" />
                            )}
                            <span className="min-w-0">
                              <span className="block font-medium break-keep">{c?.name ?? id}</span>
                              <span className="block text-xs text-muted truncate">{c?.role}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {(within[g.faction]?.length ?? 0) > 0 && (
                    <details className="mt-5 rounded-2xl border border-line px-4 py-3">
                      <summary className="cursor-pointer font-bold text-sm">관계 목록 보기 ({within[g.faction].length})</summary>
                      <div className="mt-3">
                        <HubRelationList lines={within[g.faction]} />
                      </div>
                    </details>
                  )}
                </div>
              </details>
            );
            })}
          </div>

          {cross.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif font-bold text-lg mb-3">세력을 넘는 관계</h3>
              <HubRelationList lines={cross} />
            </div>
          )}
        </section>

        {PEOPLE_IDS.length === 0 && <p className="mt-6 text-sm text-muted">열전을 준비하고 있어요.</p>}

        <CoupangBanner subId="people-hub" />
      </main>
    </div>
  );
}

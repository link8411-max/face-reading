import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CoupangBanner from "@/components/CoupangBanner";
import PersonHeader, { factionLabel } from "@/components/people/PersonHeader";
import CheerButton from "@/components/people/CheerButton";
import RelationMap from "@/components/people/RelationMap";
import SourceChip from "@/components/people/SourceChip";
import VotePoll from "@/components/people/VotePoll";
import { VERDICTS } from "@/content/samgukPeople/types";
import { pairKey } from "@/lib/people/keys";
import { PEOPLE_IDS, getPerson } from "@/content/samgukPeople";
import { getDuelGeneral } from "@/lib/duel/generals";
import { eulReul, personDescription, personTitle, portraitSrc, yearLabel } from "@/lib/people/portrait";
import { relationsOf } from "@/lib/people/relations";
import { allSamgukCharacters } from "@/lib/samgukDB";

type Props = { params: Promise<{ id: string }> };

const SITE = "https://unse-ai.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return PEOPLE_IDS.map((id) => ({ id }));
}

function ogImagePath(name: string, subtitle: string) {
  return `/api/og?title=${encodeURIComponent(`${name} 열전`)}&subtitle=${encodeURIComponent(subtitle)}`;
}

function lookup(id: string) {
  const p = getPerson(id);
  const c = allSamgukCharacters.find((x) => x.id === id);
  return p && c ? { p, c } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const found = lookup(id);
  if (!found) return {};
  const { p, c } = found;
  const title = personTitle(id);
  const description = personDescription(id);
  const url = `${SITE}/samguk/people/${id}`;
  const image = ogImagePath(c.name, p.style ? `자 ${p.style}` : c.role);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "article", locale: "ko_KR", siteName: "운명을 읽다", url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  const found = lookup(id);
  if (!found) notFound();
  const { p, c } = found;

  const url = `${SITE}/samguk/people/${id}`;
  const duel = getDuelGeneral(id);
  const duelOk = !!duel && duel.role !== "mob";
  const pending = portraitSrc(id) === null;
  const related = relationsOf(id);

  // 투표 위젯에 넘길 값 (서버에서 계산해 평범한 데이터로 보낸다)
  const rival = allSamgukCharacters.find((x) => x.id === p.rivalId);
  const rivalName = rival?.name ?? p.rivalId;
  const shareUrl = `${url}?utm_source=share&utm_medium=friend_link&utm_campaign=people`;
  const shareImage = `${SITE}${ogImagePath(c.name, p.style ? `자 ${p.style}` : c.role)}`;
  const verdictLabels = p.verdictOptions.map((key) => ({ key, label: VERDICTS.find((v) => v.key === key)?.label ?? key }));

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.name,
    alternateName: [...new Set([c.hanja, p.style, p.styleHanja].filter((x): x is string => !!x))],
    url,
  };
  if (p.born !== null) person.birthDate = String(p.born).padStart(4, "0");
  if (p.died !== null) person.deathDate = String(p.died).padStart(4, "0");
  if (c.faction !== "기타") person.affiliation = { "@type": "Organization", name: factionLabel(c.faction) };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: SITE },
      { "@type": "ListItem", position: 2, name: "삼국지 인물열전", item: `${SITE}/samguk/people` },
      { "@type": "ListItem", position: 3, name: `${c.name} 열전`, item: url },
    ],
  };

  const detailsClass = "bg-white rounded-[22px] border border-line px-5 py-4";
  const summaryClass = "font-serif font-bold text-lg cursor-pointer";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <main className="mx-auto px-[22px] max-w-lg pb-12">
        {/* 0. 쿠팡 배너 */}
        <CoupangBanner subId={`people-${id}`} />

        {/* 1. 닮은꼴 배너 */}
        <section className="mt-5 rounded-[22px] bg-card px-5 py-5 text-center">
          <p className="font-serif font-bold text-lg break-keep">나도 {c.name}{eulReul(c.name)} 닮았을까?</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/samguk" className="flex h-[52px] items-center justify-center rounded-full bg-ink text-paper font-medium px-4">
              {pending ? "삼국지 닮은꼴 테스트 하기" : `나도 ${c.name}${eulReul(c.name)} 닮았을까? 사진 한 장으로 확인하기`}
            </Link>
            {duelOk && (
              <Link href={`/samguk/duel?me=${id}`} className="flex h-[52px] items-center justify-center rounded-full border border-ink font-medium px-4">
                일기토에서 싸워 보기
              </Link>
            )}
          </div>
        </section>

        <nav className="pt-5 text-sm text-muted" aria-label="경로">
          <Link href="/samguk/people" className="underline">삼국지 인물열전</Link> / {c.name}
        </nav>

        {/* 2. 머리 카드 */}
        <PersonHeader id={id} verdictOptions={verdictLabels} />

        {/* 3. 요약·태그 */}
        <section className="mt-5">
          <p className="leading-relaxed">{p.summary}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <li key={t} className="rounded-full border border-line bg-white px-3 py-1 text-xs">{t}</li>
            ))}
          </ul>
          <div className="mt-4 bg-card-2 rounded-[22px] px-5 py-4">
            <h2 className="font-serif font-bold text-base mb-2">알고 보면 재밌는 이야기</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
              {p.funFacts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. 한눈에 보기 */}
        <section className="mt-6">
          <h2 className="font-serif font-bold text-lg mb-3">{c.name} 한눈에 보기</h2>
          <dl className="bg-white rounded-[22px] border border-line px-5 py-4 space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="text-xs text-muted">이름 뜻</dt>
              <dd>{p.nameMeaning}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">무기</dt>
              <dd>
                <p>연의: {p.weapon.novel ?? "연의 기록 없음"}</p>
                <p>정사: {p.weapon.history ?? "정사 기록 없음"}</p>
              </dd>
            </div>
            {p.famousQuote && (
              <div>
                <dt className="text-xs text-muted">대표 명언</dt>
                <dd>
                  &ldquo;{p.famousQuote.text}&rdquo;
                  <SourceChip source={p.famousQuote.source} />
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* 5. 응원 */}
        <section id="cheer" className="mt-6 scroll-mt-4">
          <CheerButton id={id} name={c.name} />
        </section>

        {/* 6. 접힌 항목 */}
        <div className="mt-6 space-y-3">
          <details className={detailsClass}>
            <summary className={summaryClass}>연의로 보는 생애</summary>
            <div className="mt-3 space-y-3 leading-relaxed">
              {p.life.split("\n\n").map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          </details>

          <details className={detailsClass}>
            <summary className={summaryClass}>주요 전투·사건</summary>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              {p.battles.map((b) => (
                <li key={`${b.name}-${b.year}`}>
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted"> ({yearLabel(b.year)})</span> {b.role}
                  <SourceChip source={b.source} />
                </li>
              ))}
            </ul>
          </details>

          <details className={detailsClass}>
            <summary className={summaryClass}>관계도·혈연</summary>
            <div className="mt-3">
              <RelationMap centerId={id} />
            </div>
          </details>

          <details className={detailsClass}>
            <summary className={summaryClass}>정사와 연의의 차이</summary>
            <div className="mt-3 leading-relaxed">
              <h3 className="font-bold text-sm">정사로 본 실제 모습</h3>
              <p className="mt-1">{p.historyNote}</p>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-sm">
                {p.novelVsHistory.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </details>
        </div>

        {/* 7~9. 투표 */}
        <section id="duel-vote" className="mt-8">
          <VotePoll
            kind="duel"
            id={id}
            target={pairKey(id, p.rivalId)}
            title={`${c.name} vs ${rivalName}, 일기토하면 누가 이길까?`}
            options={[
              { key: id, label: c.name },
              { key: p.rivalId, label: rivalName },
            ]}
            share={{
              url: shareUrl,
              imageUrl: shareImage,
              text: {
                [id]: `${c.name} vs ${rivalName}, 나는 ${c.name}. 너는?`,
                [p.rivalId]: `${c.name} vs ${rivalName}, 나는 ${rivalName}. 너는?`,
              },
            }}
          />
        </section>
        <section id="scene-vote" className="mt-8">
          <VotePoll
            kind="scene"
            id={id}
            target={id}
            title={`${c.name}의 명장면, 가장 멋진 장면은?`}
            options={p.sceneOptions.map((o) => ({ key: o.key, label: o.label, note: o.source }))}
          />
        </section>
        <section id="verdict-vote" className="mt-8">
          <VotePoll kind="verdict" id={id} target={id} title={`${c.name}${eulReul(c.name)} 한 줄로 평가한다면?`} options={verdictLabels} />
        </section>

        {/* 11. 함께 보는 인물 */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-serif font-bold text-lg mb-3">함께 보는 인물</h2>
            <ul className="grid grid-cols-2 gap-2">
              {related.map((r, i) => (
                <li key={`${r.otherId ?? r.otherName}-${i}`}>
                  {r.hasPage && r.otherId ? (
                    <Link href={`/samguk/people/${r.otherId}`} className="flex items-center justify-between rounded-full border border-line bg-white px-4 py-2.5 text-sm hover:border-accent/50 transition">
                      <span>{r.otherName}</span>
                      <span className="text-xs text-muted">{r.label}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center justify-between rounded-full border border-dashed border-line px-4 py-2.5 text-sm text-muted">
                      <span>{r.otherName}</span>
                      <span className="text-xs">{r.label}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

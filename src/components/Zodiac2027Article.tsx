import Link from "next/link";
import SeasonPicks from "@/components/SeasonPicks";
import NextSteps from "@/components/result/NextSteps";
import { birthYears, SAMJAE_2027, zodiac2027, zodiacOgPath, zodiacUrl, ZODIAC_SLUGS, type ZodiacSlug } from "@/content/fortune2027Zodiac";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";
import CoupangBanner from "@/components/CoupangBanner";
import ContentCta from "@/components/ContentCta";
import CastSay from "@/components/cast/CastSay";
import { zodiacArt } from "@/lib/art";
import { zodiacMatches } from "@/lib/zodiacMatch";
import SectionNav from "@/components/SectionNav";
import ArticleShare from "@/components/share/ArticleShare";

const card = "bg-card rounded-[22px] border border-line p-5";

// 따라다니는 단락 탭 항목(단락 id와 같아야 한다)
export const ZODIAC_SECTIONS = [
  { id: "sec-총운", label: "총운" },
  { id: "sec-재물운", label: "재물" },
  { id: "sec-연애·인간관계", label: "연애" },
  { id: "sec-직장·학업운", label: "직장" },
  { id: "sec-건강운", label: "건강" },
  { id: "sec-quarter", label: "분기" },
  { id: "sec-match", label: "궁합" },
  { id: "sec-lucky", label: "행운" },
  { id: "sec-faq", label: "FAQ" },
];
const h2 = "font-serif font-bold text-lg mb-2";

export function zodiacFaqs(slug: ZodiacSlug) {
  const z = zodiac2027[slug];
  const years = birthYears(slug);
  return [
    { q: `${FORTUNE_YEAR.year}년 ${z.띠}띠 운세는 어떤가요?`, a: z.총운 },
    { q: `${z.띠}띠는 몇 년생인가요?`, a: `${years.slice(-6).join("년, ")}년생 등이 ${z.띠}띠예요. 다만 1월 1일~2월 3일(입춘 전)에 태어났다면 전년도 띠로 봐요.` },
    { q: `${FORTUNE_YEAR.year}년 ${z.띠}띠와 잘 맞는 띠는?`, a: z.궁합 },
  ];
}

export default function Zodiac2027Article({ slug }: { slug: ZodiacSlug }) {
  const z = zodiac2027[slug];
  const years = birthYears(slug);
  const faqs = zodiacFaqs(slug);
  const url = zodiacUrl(slug);
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: `${FORTUNE_YEAR.year}년 ${z.띠}띠 운세 - ${FORTUNE_YEAR.간지}년 띠별 신년운세`,
      description: z.한줄, inLanguage: "ko-KR", mainEntityOfPage: url,
      author: { "@type": "Organization", name: "운명을 읽다" },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "운명을 읽다", item: "https://unse-ai.com" },
        { "@type": "ListItem", position: 2, name: `${FORTUNE_YEAR.year} 띠별 운세`, item: "https://unse-ai.com/fortune/2027" },
        { "@type": "ListItem", position: 3, name: `${z.띠}띠`, item: url },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <nav className="text-sm text-muted">
          <Link href="/" className="hover:text-accent-ink">홈</Link> › <Link href="/fortune/2027" className="hover:text-accent-ink">{FORTUNE_YEAR.year} 띠별 운세</Link> › {z.띠}띠
        </nav>

        <div className="grid grid-cols-2 gap-3">
          {(["f", "m"] as const).map((g, i) => (
            <img
              key={g}
              src={zodiacArt(slug, g).src}
              alt={`${z.띠}띠 ${g === "f" ? "여성" : "남성"} 캐릭터`}
              width={720}
              height={960}
              fetchPriority={i === 0 ? "high" : undefined}
              decoding="async"
              className="block w-full h-auto aspect-[3/4] object-cover rounded-[22px] border border-line bg-card"
            />
          ))}
        </div>

        <header className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold">{FORTUNE_YEAR.year}년 {z.띠}띠 운세</h1>
          <p className="text-sm text-muted">{FORTUNE_YEAR.간지}년({FORTUNE_YEAR.한자}) · {FORTUNE_YEAR.특징}</p>
          <p className="font-medium">{z.한줄}</p>
        </header>

        <CastSay cast="baksu" lineKey="say.zodiac.intro" />

        <SectionNav items={ZODIAC_SECTIONS} />

        <section className={card}>
          <h2 className={h2}>{z.띠}띠 출생연도</h2>
          <p className="leading-relaxed">{years.map((y) => `${y}년`).join(", ")}생</p>
          <p className="text-xs text-muted mt-2">※ 띠는 입춘(2월 4일 무렵)에 바뀌어요. 1월 1일~2월 3일에 태어났다면 전년도 띠의 운세를 보세요.</p>
        </section>

        {SAMJAE_2027[slug] && (
          <section className={card}>
            <h2 className={h2}>{FORTUNE_YEAR.year}년 {z.띠}띠 삼재</h2>
            <p className="leading-relaxed">
              {FORTUNE_YEAR.year}년 {FORTUNE_YEAR.간지}년은 {z.띠}띠의 <strong>날삼재</strong>예요. 돼지·토끼·양띠는 2025년 들삼재, 2026년 눌삼재를 지나 올해 삼재가 끝나요.
              날삼재는 삼재가 나가는 마지막 해라, 그동안 미뤄 둔 일을 차분히 마무리하면 다음 흐름으로 가볍게 넘어간다고 봐요.
            </p>
            <p className="mt-3">
              <Link href="/bujeok?wish=samjae" className="font-bold text-accent-ink">삼재 막이 부적 만들기</Link>
            </p>
          </section>
        )}

        {([["총운", z.총운], ["재물운", z.재물], ["연애·인간관계", z.연애관계], ["직장·학업운", z.직장학업], ["건강운", z.건강]] as const).map(([title, body]) => (
          <section key={title} id={`sec-${title}`} className={`${card} scroll-mt-16`}>
            <h2 className={h2}>{title}</h2>
            <p className="leading-relaxed">{body}</p>
          </section>
        ))}

        <section id="sec-quarter" className={`${card} scroll-mt-16`}>
          <h2 className={h2}>분기별 흐름</h2>
          <ol className="space-y-3">
            {z.분기.map((q, i) => (
              <li key={i}><span className="font-bold">{i + 1}분기</span> · <span className="leading-relaxed">{q}</span></li>
            ))}
          </ol>
        </section>

        <ContentCta href="/face2" title={`${z.띠}띠인 내 얼굴은 무슨 상일까?`} desc="사진 한 장이면 관상 풀이가 1분 안에 나와요. 사진은 저장하지 않아요." label="내 관상 보기" />

        <section id="sec-match" className={`${card} scroll-mt-16`}>
          <h2 className={h2}>{FORTUNE_YEAR.year}년 잘 맞는 띠</h2>
          {/* 11/14 사용자 "상세 내에 궁합이 제일 잘 맞는 거 보여 주고, 삼국지 상세처럼": 잘 맞는 띠 셋을 캐릭터 카드로 */}
          <ul className="grid grid-cols-3 gap-2.5 mb-4">
            {zodiacMatches(slug).map((m, i) => (
              <li key={m.slug}>
                <Link href={`/fortune/2027/${m.slug}`} className="block text-center">
                  <img src={zodiacArt(m.slug, i % 2 === 0 ? "f" : "m").src} alt={`${zodiac2027[m.slug].띠}띠 ${i % 2 === 0 ? "여성" : "남성"} 캐릭터`} width={720} height={960} loading="lazy" className="block w-full h-auto aspect-[3/4] object-cover rounded-[16px] border border-line bg-card-2" />
                  <p className="mt-1.5 font-bold text-sm">{zodiac2027[m.slug].띠}띠</p>
                  <p className="text-[11px] text-accent-ink">{m.kind === "육합" ? `짝꿍 · ${m.pair}` : m.pair}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="leading-relaxed">{z.궁합}</p>
        </section>

        <section className={card}>
          <h2 className={h2}>올해 해 보면 좋은 일</h2>
          <p className="leading-relaxed">{z.추천}</p>
        </section>

        <section id="sec-lucky" className={`${card} scroll-mt-16`}>
          <h2 className={h2}>행운을 부르는 것</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">행운의 색</dt><dd>{z.행운.색}</dd>
            <dt className="text-muted">행운의 숫자</dt><dd>{z.행운.숫자}</dd>
            <dt className="text-muted">행운의 방위</dt><dd>{z.행운.방위}</dd>
            <dt className="text-muted">행운의 아이템</dt><dd>{z.행운.아이템}</dd>
          </dl>
        </section>

        <section className={card}>
          <h2 className={h2}>한마디 조언</h2>
          <p className="leading-relaxed">{z.조언}</p>
        </section>

        <ArticleShare giftNudge testName="zodiac" title={`${FORTUNE_YEAR.year} ${z.띠}띠 운세 – 운명을 읽다`} text={`${FORTUNE_YEAR.year}년 ${z.띠}띠 운세예요. 너도 확인해 봐`} url={url} imageUrl={`https://unse-ai.com${zodiacOgPath(slug)}`} />

        <SeasonPicks slot={`zodiac_${slug}`} />

        <NextSteps from="zodiac" className="" />

        <Link href="/fortune" className="block text-center h-[52px] leading-[52px] bg-accent rounded-full font-medium text-white">
          내 생년월일 사주로 {FORTUNE_YEAR.year} 운세 자세히 보기
        </Link>

        <Link href="/mbti/match" className="block text-center py-3 bg-card border border-line rounded-2xl font-bold text-accent-ink hover:bg-card">
          MBTI 궁합도 보기
        </Link>

        <section id="sec-faq" className={`${card} scroll-mt-16`}>
          <h2 className={h2}>자주 묻는 질문</h2>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="bg-card rounded-2xl border border-line px-4 py-3">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className={h2}>다른 띠 {FORTUNE_YEAR.year} 운세</h2>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {ZODIAC_SLUGS.filter((s) => s !== slug).map((s) => (
              <Link key={s} href={`/fortune/2027/${s}`} className="bg-card rounded-xl border border-line py-2 hover:bg-card">
                {zodiac2027[s].띠}띠
              </Link>
            ))}
          </div>
        </section>

        <CoupangBanner subId={`zodiac-${slug}`} />
        <p className="text-center text-xs text-muted">재미로 읽는 운세예요. 과학적 근거는 없어요.</p>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}

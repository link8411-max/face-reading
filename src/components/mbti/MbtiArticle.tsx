import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import MonthlyFortune from "@/components/mbti/MonthlyFortune";
import { mbtiProfiles, monthlyFor } from "@/content/mbtiTypes";
import { MBTI_TYPES, bestMatches, compatSummary, type MbtiType } from "@/lib/mbti/compat";

const card = "bg-white border border-line rounded-3xl p-5";
const h2 = "font-bold text-lg text-vermilion mb-2";

export function mbtiFaqs(type: MbtiType) {
  const p = mbtiProfiles[type];
  const best = bestMatches(type, "love");
  return [
    { q: `${type}와 잘 맞는 MBTI는?`, a: `연애 궁합으로는 ${best.join(", ")}와 특히 잘 맞아요. ${compatSummary(type, best[0]).lines.slice(0, 2).join(" ")}` },
    { q: `${type}의 연애 스타일은?`, a: p.love },
    { q: `${type}에게 어울리는 직업은?`, a: `${p.jobs.map((j) => j.title).join(", ")} 같은 일이 잘 어울려요. ${p.workStyle}` },
  ];
}

export default function MbtiArticle({ type }: { type: MbtiType }) {
  const p = mbtiProfiles[type];
  const slug = type.toLowerCase();
  const url = `https://unse-ai.com/mbti/${slug}`;
  const faqs = mbtiFaqs(type);
  const ranking = MBTI_TYPES.map((b) => ({ b, s: compatSummary(type, b) })).sort((x, y) => y.s.total - x.s.total || x.b.localeCompare(y.b));
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "Article", headline: `${type} ${p.nickname} — 궁합·연애·여행지·직업`, inLanguage: "ko-KR", mainEntityOfPage: url, author: { "@type": "Organization", name: "운명을 읽다" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "운명을 읽다", item: "https://unse-ai.com" },
      { "@type": "ListItem", position: 2, name: "MBTI", item: "https://unse-ai.com/mbti" },
      { "@type": "ListItem", position: 3, name: type, item: url },
    ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const monthly = monthlyFor(type, new Date());

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <nav className="text-sm text-muted"><Link href="/">홈</Link> › <Link href="/mbti">MBTI</Link> › {type}</nav>
      <header className="text-center">
        <p className="text-sm font-bold text-gold">{p.nickname}</p>
        <h1 className="font-serif text-4xl font-bold text-vermilion mt-1">{type}</h1>
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {p.strengths.map((s) => <span key={s} className="text-xs font-bold px-2.5 py-1 rounded-full bg-vermilion/10 text-vermilion">{s}</span>)}
        </div>
      </header>

      <section className={card}><h2 className={h2}>{type}는 이런 사람</h2><p className="leading-relaxed">{p.summary}</p></section>

      <section className={card}>
        <h2 className={h2}>{type}와 잘 맞는 유형</h2>
        <div className="space-y-3">
          {bestMatches(type, "love").map((b) => {
            const s = compatSummary(type, b);
            return (
              <div key={b} className="rounded-2xl bg-paper p-3">
                <p className="font-bold"><Link href={`/mbti/${b.toLowerCase()}`} className="text-vermilion">{b}</Link> · {s.label} <span className="text-gold">{s.total}점</span></p>
                <p className="text-sm leading-relaxed mt-1">{s.lines.join(" ")}</p>
              </div>
            );
          })}
        </div>
        <p className="text-sm mt-3"><b>친구로 잘 맞는 유형</b> · {bestMatches(type, "friend").join(", ")} — {compatSummary(type, bestMatches(type, "friend")[0]).lines[0]}</p>
        <p className="text-sm mt-1"><b>함께 일하기 좋은 유형</b> · {bestMatches(type, "work").join(", ")} — {compatSummary(type, bestMatches(type, "work")[0]).lines[2]}</p>
        <Link href={`/mbti/match?a=${type}`} className="block text-center mt-4 py-3 rounded-2xl bg-vermilion text-white font-bold">궁합 계산기로 자세히 보기 →</Link>
      </section>

      <section className={card}>
        <h2 className={h2}>16유형 궁합 한눈에 보기</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-muted text-xs"><th className="text-left py-1">유형</th><th>연애</th><th>친구</th><th>직장</th><th>종합</th></tr></thead>
          <tbody>
            {ranking.map(({ b, s }) => (
              <tr key={b} className="border-t border-line">
                <td className="py-1.5"><Link href={`/mbti/match?a=${type}&b=${b}`} className="font-bold">{b}</Link></td>
                <td className="text-center">{s.love}</td><td className="text-center">{s.friend}</td><td className="text-center">{s.work}</td>
                <td className="text-center font-bold text-vermilion">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted mt-2">※ 재미로 보는 궁합이에요. 성격의 네 가지 축이 같은지 다른지로 계산했어요.</p>
      </section>

      <section className={card}><h2 className={h2}>{type}의 연애 스타일</h2><p className="leading-relaxed">{p.love}</p></section>

      <section className={card}>
        <h2 className={h2}>{type}와 잘 맞는 여행지</h2>
        <h3 className="font-bold text-sm mt-1">국내</h3>
        <ul className="space-y-1.5 mt-1 text-sm">{p.travel.domestic.map((t) => <li key={t.place}><b>{t.place}</b> — {t.why}</li>)}</ul>
        <h3 className="font-bold text-sm mt-3">해외</h3>
        <ul className="space-y-1.5 mt-1 text-sm">{p.travel.abroad.map((t) => <li key={t.place}><b>{t.place}</b> — {t.why}</li>)}</ul>
      </section>

      <section className={card}>
        <h2 className={h2}>{type}에게 어울리는 직업</h2>
        <ul className="space-y-1.5 text-sm">{p.jobs.map((j) => <li key={j.title}><b>{j.title}</b> — {j.why}</li>)}</ul>
        <p className="leading-relaxed text-sm mt-3">{p.workStyle}</p>
      </section>

      <MonthlyFortune month={p.monthly.month} text={p.monthly.text} lucky={p.monthly.lucky} visibleAtBuild={monthly !== null} />

      <CoupangBanner subId={`mbti-${slug}`} />

      <section className={card}>
        <h2 className={h2}>자주 묻는 질문</h2>
        <div className="space-y-2">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-2xl border border-line px-4 py-3"><summary className="font-medium cursor-pointer">{f.q}</summary><p className="mt-2 text-sm leading-relaxed">{f.a}</p></details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-base mb-2">다른 유형 보기</h2>
        <div className="grid grid-cols-4 gap-2 text-center text-sm font-bold">
          {MBTI_TYPES.filter((t) => t !== type).map((t) => <Link key={t} href={`/mbti/${t.toLowerCase()}`} className="bg-white border border-line rounded-xl py-2">{t}</Link>)}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}

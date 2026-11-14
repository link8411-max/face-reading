import Link from "next/link";
import { pageGuides, faqJsonLd, TEST_LINKS, type GuideRoute } from "@/content/pageGuides";
import { pageGuides as enGuides, TEST_LINKS_EN, type EnGuideData, type EnGuideRoute } from "@/content/en/pageGuides";
import { counterpart } from "@/lib/i18n/alternates";
import { t } from "@/lib/i18n/dict";
import { localePath, type Locale } from "@/lib/i18n/locales";

function enFaqJsonLd(guide: EnGuideData): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// 테스트 위젯 아래에 붙는 서버 렌더 설명 섹션 (결과 이미지 캡처에서 제외: no-screenshot)
export default function PageGuide({ route, locale = "ko" }: { route: GuideRoute | EnGuideRoute; locale?: Locale }) {
  const en = locale === "en";
  const guide = en ? enGuides[route as EnGuideRoute] : pageGuides[route as GuideRoute];
  if (!guide) return null;
  // 영어판에는 영어 페이지가 있는 테스트만 잇는다
  const related = en ? guide.related.filter((r) => counterpart(r, "en")) : guide.related;
  const labelOf = (r: string) => (en ? TEST_LINKS_EN[r].label : (TEST_LINKS as Record<string, { label: string }>)[r].label);

  return (
    <section data-page-guide className="no-screenshot bg-paper text-ink border-t border-line">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-[22px] font-bold break-keep">{guide.heading}</h2>
        </div>

        <p className="leading-relaxed text-center text-muted">{guide.summary}</p>

        {guide.sections?.map((s) => (
          <div key={s.heading}>
            <h3 className="font-serif font-bold text-lg mb-3">{s.heading}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {s.items.map((it) => (
                <li key={it.title} className="bg-card rounded-[18px] border border-line px-4 py-3">
                  {it.href ? (
                    <Link href={it.href} className="font-bold hover:text-accent-ink">{it.title}</Link>
                  ) : (
                    <p className="font-bold">{it.title}</p>
                  )}
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">{it.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* 본문은 접어 두되 HTML에는 남겨 검색엔진이 읽게 한다 */}
        <details className="group bg-card rounded-[22px] border border-line px-5 py-4">
          <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
            {t(locale, "guide.more")}
            <span className="transition group-open:rotate-180" aria-hidden>▾</span>
          </summary>
          <div className="mt-4 space-y-3 leading-relaxed">
            {guide.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {guide.highlights.map((h) => (
              <div key={h.title}>
                <h3 className="font-bold mb-1">{h.title}</h3>
                <p>{h.body}</p>
              </div>
            ))}
          </div>
        </details>

        <div>
          <h3 className="font-serif font-bold text-lg mb-3">{t(locale, "guide.faq")}</h3>
          <div className="space-y-2">
            {guide.faqs.map((f) => (
              <details key={f.q} className="bg-card rounded-[18px] border border-line px-4 py-3">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif font-bold text-lg mb-3">{t(locale, "guide.related")}</h3>
          <div className="grid grid-cols-1 gap-2">
            {related.map((r) => (
              <Link
                key={r}
                href={localePath(locale, r)}
                className="bg-card rounded-full border border-line px-5 py-3 font-medium hover:border-accent/50 transition"
              >
                {labelOf(r)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: en ? enFaqJsonLd(guide as EnGuideData) : faqJsonLd(route as GuideRoute) }} />
    </section>
  );
}

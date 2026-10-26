import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import SeasonHero from "@/components/home/SeasonHero";
import ZodiacPicker from "@/components/home/ZodiacPicker";
import CategoryTabs from "@/components/home/CategoryTabs";
import { HOME_FAQS } from "@/content/homeFaq";
import { ZODIAC_SLUGS, zodiac2027 } from "@/content/fortune2027Zodiac";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";

// 홈 전용 FAQ 구조화 데이터 (테스트 페이지는 PageGuide가 각자 FAQPage를 렌더)
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function Home() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <header className="flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-black text-vermilion">
          운명을 <span className="text-gold">읽다</span>
        </Link>
      </header>

      <SeasonHero />
      <ZodiacPicker />
      <CategoryTabs />

      <section aria-label={`${FORTUNE_YEAR.year} 띠별 운세`}>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-black text-base">{FORTUNE_YEAR.year} 띠별 운세</h2>
          <Link href="/fortune/2027" className="text-xs text-muted">전체 →</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]">
          {ZODIAC_SLUGS.map((s) => (
            <Link key={s} href={`/fortune/2027/${s}`} className="flex-none w-16 text-center bg-white border border-line rounded-2xl py-2 text-[11px] font-bold">
              <span aria-hidden className="block text-2xl">{zodiac2027[s].이모지}</span>
              {zodiac2027[s].띠}
            </Link>
          ))}
        </div>
      </section>

      <CoupangBanner subId="home" />

      <section aria-label="자주 묻는 질문">
        <h2 className="font-black text-base mb-2">자주 묻는 질문</h2>
        <div className="space-y-2">
          {HOME_FAQS.map((f) => (
            <details key={f.q} className="bg-white border border-line rounded-2xl px-4 py-3">
              <summary className="font-medium cursor-pointer">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-4">⚠️ 재미로만 봐주세요! 과학적 근거는 없습니다.</p>
      </section>
    </div>
  );
}

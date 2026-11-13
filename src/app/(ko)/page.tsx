import Link from "next/link";
import CoupangBanner from "@/components/CoupangBanner";
import FaceHero from "@/components/home/FaceHero";
import SeasonCard from "@/components/home/SeasonCard";
import HomeGrid from "@/components/home/HomeGrid";
import TodayRow from "@/components/home/TodayRow";
import { ALL_ITEMS } from "@/content/navigation";
import { HOME_FAQS } from "@/content/homeFaq";
import { FORTUNE_YEAR } from "@/lib/fortuneYear";

// 홈 전용 FAQ 구조화 데이터 (테스트 페이지는 PageGuide가 각자 FAQPage를 렌더)
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function Home() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <header className="px-1.5 rise">
        <h1 className="flex flex-col">
          <Link href="/" className="font-serif text-[22px] font-extrabold tracking-tight text-ink">운명을 읽다</Link>
          <span className="text-xs text-muted font-normal mt-0.5">무료 AI 관상과 내 사주 풀이, {FORTUNE_YEAR.year} 신년운세</span>
        </h1>
      </header>

      {/* 칩 → 대표 카드(관상) → 시즌 띠(평소 내 사주 풀이, 12~1월 신년운세 — src/content/season.ts) → 카드 2열 */}
      <HomeGrid items={ALL_ITEMS}>
        <FaceHero />
        <SeasonCard />
      </HomeGrid>

      <TodayRow />
      <CoupangBanner subId="home" />

      <section aria-label="자주 묻는 질문">
        <details className="bg-card border border-line rounded-[22px] px-4 py-3">
          <summary className="font-bold cursor-pointer text-[15px]">자주 묻는 질문</summary>
          <div className="space-y-2 mt-3">
            {HOME_FAQS.map((f) => (
              <details key={f.q} className="bg-card-2 rounded-[16px] px-4 py-3">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="text-xs text-muted text-center mt-4">재미로만 봐 주세요. 과학적 근거는 없어요.</p>
        </details>
      </section>
    </div>
  );
}

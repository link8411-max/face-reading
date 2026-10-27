import Link from "next/link";
import SeasonPicks from "@/components/SeasonPicks";
import CoupangBanner from "@/components/CoupangBanner";
import FaceHero from "@/components/home/FaceHero";
import PlayTogether from "@/components/home/PlayTogether";
import SeasonCard from "@/components/home/SeasonCard";
import { Icon } from "@/components/icons";
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
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-[30px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <header className="flex items-start justify-between px-1.5">
        <h1 className="flex flex-col">
          <Link href="/" className="font-serif text-[19px] font-bold text-ink">운명을 읽다</Link>
          <span className="text-xs text-muted font-normal mt-0.5">무료 AI 관상·얼굴 테스트와 {FORTUNE_YEAR.year} 신년운세</span>
        </h1>
        <Icon name="moon" className="text-ink mt-0.5" />
      </header>

      <div className="!mt-[18px]">
        <FaceHero />
      </div>
      <div className="px-1.5">
        <PlayTogether />
      </div>
      <div className="px-1.5">
        <ZodiacPicker />
      </div>
      {/* 쿠팡 배너: 첫 흐름(히어로·친구랑·띠) 다음 */}
      <CoupangBanner subId="home" />
      <SeasonCard />
      <SeasonPicks slot="home" />
      <CategoryTabs />

      <section aria-label={`${FORTUNE_YEAR.year} 띠별 운세`}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif font-bold text-[17px]">{FORTUNE_YEAR.year} 띠별 운세</h2>
          <Link href="/fortune/2027" className="text-[13px] text-muted">전체 보기</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {ZODIAC_SLUGS.map((s) => (
            <Link key={s} href={`/fortune/2027/${s}`} className="h-10 px-4 rounded-full border border-[#E2D8CA] bg-white grid place-items-center text-sm">
              {zodiac2027[s].띠}띠
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="자주 묻는 질문">
        <h2 className="font-serif font-bold text-[17px] mb-3">자주 묻는 질문</h2>
        <div className="space-y-2">
          {HOME_FAQS.map((f) => (
            <details key={f.q} className="bg-white border border-line rounded-[18px] px-4 py-3">
              <summary className="font-medium cursor-pointer">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-4">재미로만 봐 주세요. 과학적 근거는 없어요.</p>
      </section>
    </div>
  );
}

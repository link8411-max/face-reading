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
          <span className="text-xs text-muted font-normal mt-0.5">무료 AI 관상과 내 사주 풀이, {FORTUNE_YEAR.year} 신년운세</span>
        </h1>
        <Icon name="moon" className="text-ink mt-0.5" />
      </header>

      {/* 임시 띠(11월 11일 추가): 인스타 프로필 링크가 아직 첫 화면이라, 릴스를 보고 온 사람이 밈 능력고사를 바로 찾게 한다.
          인스타 프로필 링크를 /exam/meme으로 바꾸면 이 띠를 지운다(tests/home.test.ts의 임시 띠 테스트도 함께). */}
      <Link
        href="/exam/meme"
        className="!mt-[14px] flex min-h-[48px] items-center justify-between gap-3 rounded-full border border-line bg-card px-5 py-2.5 text-sm"
      >
        <span><b className="font-bold text-accent">밈 능력고사</b><span className="text-ink"> · 매일 5문제, 내 등급은?</span></span>
        <span aria-hidden="true" className="font-bold text-accent">풀기</span>
      </Link>

      <div className="!mt-[14px]">
        <FaceHero />
      </div>
      {/* 시즌 카드는 히어로 바로 아래(평소 내 사주 풀이, 12~1월 신년운세 — src/content/season.ts) */}
      <SeasonCard />
      <div className="px-1.5">
        <ZodiacPicker />
      </div>
      <div className="px-1.5">
        <PlayTogether />
      </div>
      <CoupangBanner subId="home" />
      <SeasonPicks slot="home" />
      <CategoryTabs />

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

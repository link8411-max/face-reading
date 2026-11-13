import Link from "next/link";
import { CAST } from "@/content/cast";
import { HOME_HERO, EN_HERO_ROUTES } from "@/content/homeHero";
import HeroScroller from "@/components/home/HeroScroller";
import { t } from "@/lib/i18n/dict";
import { localePath, type Locale } from "@/lib/i18n/locales";

// 홈 대표 캐러셀: 캐릭터 큰 카드. 첫 장만 먼저 받고(LCP) 나머지는 늦게 받는다. 모든 장이 서버 HTML에 있다.
export default function FaceHero({ locale = "ko" }: { locale?: Locale }) {
  const slides = locale === "en" ? HOME_HERO.filter((s) => EN_HERO_ROUTES.includes(s.href)) : HOME_HERO;
  return (
    <section aria-label={t(locale, "home.heroAria")}>
      <HeroScroller total={slides.length}>
        {slides.map((s, i) => {
          const c = CAST[s.cast];
          const name = locale === "en" ? c.en : c.name;
          return (
            <Link
              key={s.cast}
              href={localePath(locale, s.href)}
              data-hero-slide
              data-index={i}
              className="relative flex-none w-full h-[500px] snap-center block overflow-hidden"
              style={{ background: c.bg }}
            >
              <img
                src={c.img}
                alt={`${name} ${t(locale, "cast.alt")}`}
                width={720}
                height={960}
                {...(i === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const, decoding: "async" as const })}
                className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
              />
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-[270px] bg-gradient-to-b from-transparent via-paper/85 to-paper" />
              <span className="absolute left-5 right-5 bottom-[22px] flex flex-col gap-2.5">
                <span className="self-start px-2.5 py-1 rounded-full bg-lime text-paper text-xs font-bold">{t(locale, s.kindKey)}</span>
                <h2 className="font-serif text-[28px] leading-[1.25] font-extrabold tracking-tight break-keep text-ink">{t(locale, s.titleKey)}</h2>
                <p className="text-sm leading-[1.55] text-ink/80 break-keep">&ldquo;{t(locale, s.sayKey)}&rdquo;</p>
                <span className="mt-1.5 h-[52px] rounded-full bg-accent text-white text-base font-bold flex items-center justify-center">{t(locale, s.ctaKey)}</span>
              </span>
            </Link>
          );
        })}
      </HeroScroller>
    </section>
  );
}

import { Fragment } from "react";
import Link from "next/link";
import { CAST } from "@/content/cast";
import TodayLabel from "@/components/home/TodayLabel";
import { t } from "@/lib/i18n/dict";
import { localePath, type Locale } from "@/lib/i18n/locales";

// 메인 대표 카드: 관상(/face2)으로 바로 이어진다. 오른쪽은 관상을 맡은 해태.
export default function FaceHero({ locale = "ko" }: { locale?: Locale }) {
  const c = CAST.haetae;
  const lines = t(locale, "home.heroHeading").split("\n");
  return (
    <section aria-labelledby="face-hero-title" className="press relative overflow-hidden bg-card border border-line rounded-[28px] p-[22px] min-h-[210px]">
      <div className="relative z-10 max-w-[56%]">
        <span className="inline-block text-xs font-bold bg-lime text-paper px-2.5 py-1 rounded-full">{t(locale, "home.badge")}</span>
        <h2 id="face-hero-title" className="font-serif font-extrabold text-[23px] leading-[1.3] tracking-tight mt-3 break-keep">
          {lines.map((l, i) => (
            <Fragment key={l}>
              {i > 0 && <br />}
              {l}
            </Fragment>
          ))}
        </h2>
        {locale === "ko" && <p className="text-xs text-muted mt-2"><TodayLabel suffix="오늘의 얼굴 운" /></p>}
        <Link href={localePath(locale, "/face2")} className="mt-3.5 h-11 px-5 rounded-full inline-flex items-center justify-center bg-accent text-white text-[15px] font-bold">
          {t(locale, "home.heroStart")}<span className="sr-only">{t(locale, "home.heroSr")}</span>
        </Link>
        <p className="text-[11px] text-muted mt-2">{t(locale, "home.heroPrivacy")}</p>
      </div>
      <img
        src={c.img}
        alt={`${locale === "en" ? c.en : c.name} ${t(locale, "cast.alt")}`}
        width={142}
        height={142}
        fetchPriority="high"
        className="absolute right-3.5 bottom-3.5 w-[142px] h-[142px] rounded-[34px] object-cover"
        style={{ background: c.bg }}
      />
    </section>
  );
}

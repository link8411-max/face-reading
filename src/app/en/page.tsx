import type { Metadata } from "next";
import Link from "next/link";
import FaceHero from "@/components/home/FaceHero";
import HomeGrid from "@/components/home/HomeGrid";
import OnlyKoreanNote from "@/components/i18n/OnlyKoreanNote";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import PageGuide from "@/components/PageGuide";
import { enMetadata } from "@/lib/i18n/enMetadata";
import { EN_ITEMS } from "@/lib/i18n/enItems";
import { t } from "@/lib/i18n/dict";

export const metadata: Metadata = enMetadata("/", "Read your fate");

export default function EnHome() {
  return (
    <>
      <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-6">
        <header className="px-1.5 rise flex items-start justify-between">
          <h1 className="flex flex-col">
            <Link href="/en" className="font-serif text-[22px] font-extrabold tracking-tight text-ink">{t("en", "brand.name")}</Link>
            <span className="text-xs text-muted font-normal mt-0.5">{t("en", "home.sub")}</span>
          </h1>
          <LanguageSwitch className="-mr-2 -mt-1" />
        </header>
        <OnlyKoreanNote />
        <HomeGrid items={EN_ITEMS} locale="en">
          <FaceHero locale="en" />
        </HomeGrid>
      </div>
      <PageGuide route="/" locale="en" />
    </>
  );
}

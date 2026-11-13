import type { Metadata } from "next";
import AllTests from "@/app/(ko)/all/AllTests";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import { languageAlternates } from "@/lib/i18n/alternates";
import { EN_ITEMS } from "@/lib/i18n/enItems";
import { t } from "@/lib/i18n/dict";

const url = "https://unse-ai.com/en/all";
const title = `${t("en", "all.title")} | unse-ai.com`;
const description = t("en", "all.desc");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url, languages: languageAlternates("/all") },
  openGraph: { title, description, url, type: "website", locale: "en_US", siteName: "unse-ai.com", images: [{ url: `/api/og?title=${encodeURIComponent(t("en", "all.title"))}&cast=haetae`, width: 1200, height: 630 }] },
};

export default function Page() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-[28px] font-extrabold tracking-tight">{t("en", "all.title")}</h1>
        <LanguageSwitch className="-mr-2" />
      </div>
      <p className="text-sm text-muted leading-relaxed mt-2 mb-5">{t("en", "all.desc")}</p>
      <AllTests items={EN_ITEMS} />
    </div>
  );
}

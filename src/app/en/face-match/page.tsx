import type { Metadata } from "next";
import FaceMatchClient from "@/components/faceMatch/FaceMatchClient";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import PageGuide from "@/components/PageGuide";
import { EnCopyProvider } from "@/lib/i18n/copy";
import { EN_ANIMALS } from "@/lib/i18n/enCopy";
import { enJsonLd, enMetadata } from "@/lib/i18n/enMetadata";
import { t } from "@/lib/i18n/dict";

export const metadata: Metadata = enMetadata("/face-match", "Face Match");

export default function FaceMatchPage() {
  const lines = t("en", "fm.heading").split("\n");
  return (
    <>
      {enJsonLd("/face-match", "Face Match").map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <main className="mx-auto px-[22px] max-w-lg">
        <header className="pt-5 pb-1 relative">
          <h1 className="text-sm font-medium text-center">{t("en", "fm.title")}</h1>
          <LanguageSwitch className="absolute right-[-8px] top-1" />
        </header>
        <h2 className="mt-4 font-serif font-bold text-[27px] leading-[1.4] break-keep">
          {lines[0]}
          <br />
          {lines[1]}
        </h2>
        <p className="mt-2.5 mb-5 text-sm text-muted leading-relaxed">{t("en", "fm.desc")}</p>
        <EnCopyProvider copy={{ animals: EN_ANIMALS }}>
          <FaceMatchClient />
        </EnCopyProvider>
      </main>
      <PageGuide route="/face-match" locale="en" />
    </>
  );
}

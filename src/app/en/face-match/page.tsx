import type { Metadata } from "next";
import FaceMatchClient from "@/components/faceMatch/FaceMatchClient";
import CastHero from "@/components/cast/CastHero";
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
          <div className="absolute right-[-8px] top-1"><LanguageSwitch /></div>
        </header>
        <EnCopyProvider copy={{ animals: EN_ANIMALS }}>
          <FaceMatchClient
            top={<CastHero cast="gumiho" lineKey="say.faceMatch.start" locale="en" heading={`${lines[0]}\n${lines[1]}`} />}
            head={
              <>
                <h2 className="mt-1 mb-3.5 font-serif font-bold text-[24px] leading-[1.35] break-keep">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </h2>
              </>
            }
            intro={<p className="mt-5 text-sm text-muted leading-relaxed">{t("en", "fm.desc")}</p>}
          />
        </EnCopyProvider>
      </main>
      <PageGuide route="/face-match" locale="en" />
    </>
  );
}

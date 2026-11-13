import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";
import { enJsonLd, enMetadata } from "@/lib/i18n/enMetadata";

export const metadata: Metadata = enMetadata("/face2", "AI Face Reading");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {enJsonLd("/face2", "AI Face Reading").map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      {children}
      <PageGuide route="/face2" locale="en" />
    </>
  );
}

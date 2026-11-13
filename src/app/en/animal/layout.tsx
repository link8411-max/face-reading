import type { Metadata } from "next";
import PageGuide from "@/components/PageGuide";
import { enJsonLd, enMetadata } from "@/lib/i18n/enMetadata";

export const metadata: Metadata = enMetadata("/animal", "Animal Face Test");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {enJsonLd("/animal", "Animal Face Test").map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      {children}
      <PageGuide route="/animal" locale="en" />
    </>
  );
}

import type { Metadata } from "next";
import CategoryList from "@/components/CategoryList";
import { CATEGORIES } from "@/content/navigation";

const category = CATEGORIES[1];
const url = "https://unse-ai.com/unse";

export const metadata: Metadata = {
  title: `${category.title} 모음 | 운명을 읽다`,
  description: category.intro,
  alternates: { canonical: url },
  openGraph: { title: `${category.title} 모음 | 운명을 읽다`, description: category.intro, url, type: "website", locale: "ko_KR", siteName: "운명을 읽다" },
};

export default function Page() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl font-black text-vermilion">{category.title}</h1>
      <p className="text-sm text-muted leading-relaxed mt-2 mb-6">{category.intro}</p>
      <CategoryList items={category.items} />
    </div>
  );
}

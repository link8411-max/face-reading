import Link from "next/link";
import { pageGuides, faqJsonLd, TEST_LINKS, type GuideRoute } from "@/content/pageGuides";

// 테스트 위젯 아래에 붙는 서버 렌더 설명 섹션 (결과 이미지 캡처에서 제외: no-screenshot)
export default function PageGuide({ route }: { route: GuideRoute }) {
  const guide = pageGuides[route];
  if (!guide) return null;

  return (
    <section className="no-screenshot bg-gradient-to-b from-[#F5E6D3] to-[#E8D4C4] text-[#5C4033]">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-3">
            <span className="text-[#C41E3A]/70">━━</span>
            <span className="text-xl">☯</span>
            <span className="text-[#C41E3A]/70">━━</span>
          </div>
          <h2 className="text-2xl font-bold text-[#C41E3A]">{guide.heading}</h2>
        </div>

        <div className="space-y-3 leading-relaxed">
          {guide.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-[#C41E3A]/30 shadow-lg p-5">
          <h3 className="font-bold text-lg mb-3 text-[#C41E3A]">이렇게 해요</h3>
          <ol className="list-decimal pl-5 space-y-2">
            {guide.howTo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="space-y-3">
          {guide.highlights.map((h) => (
            <div key={h.title} className="bg-white/60 rounded-3xl border-2 border-[#C41E3A]/30 p-5">
              <h3 className="font-bold mb-1 text-[#C41E3A]">{h.title}</h3>
              <p className="leading-relaxed">{h.body}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3 text-[#C41E3A]">자주 묻는 질문</h3>
          <div className="space-y-2">
            {guide.faqs.map((f) => (
              <details key={f.q} className="bg-white/60 rounded-2xl border border-[#C41E3A]/20 px-4 py-3">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <p className="mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3 text-[#C41E3A]">다른 테스트도 해보세요</h3>
          <div className="grid grid-cols-1 gap-2">
            {guide.related.map((r) => (
              <Link
                key={r}
                href={r}
                className="bg-white/60 rounded-2xl border-2 border-[#C41E3A]/30 px-4 py-3 font-medium hover:bg-white/80 transition"
              >
                {TEST_LINKS[r].emoji} {TEST_LINKS[r].label} →
              </Link>
            ))}
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(route) }} />
    </section>
  );
}

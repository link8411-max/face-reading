import Link from "next/link";

// 글 중간 관상 테스트 안내 카드 (띠·MBTI 글처럼 검색으로 들어온 사람이 다음으로 갈 곳)
export default function ContentCta({ href, title, desc, label }: { href: string; title: string; desc: string; label: string }) {
  return (
    <section className="no-screenshot bg-card border border-line rounded-[22px] p-5">
      <p className="font-bold text-lg">{title}</p>
      <p className="text-[14px] text-muted mt-1">{desc}</p>
      <Link href={href} className="mt-4 h-[52px] rounded-full flex items-center justify-center bg-accent text-white text-[15px] font-medium">
        {label}
      </Link>
    </section>
  );
}

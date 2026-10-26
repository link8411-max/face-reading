import Link from "next/link";
import type { CategoryItem } from "@/content/navigation";

// 묶음 항목 목록 (썸네일 + 제목 + 설명 + 칩) — 홈 묶음 탭과 허브 페이지 공용
export default function CategoryList({ items }: { items: CategoryItem[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="flex gap-3 items-center bg-white border border-line rounded-2xl p-2.5 hover:border-vermilion/50 transition">
            <span
              aria-hidden
              className="w-16 h-16 flex-none rounded-xl grid place-items-center text-3xl bg-cover bg-top"
              style={item.thumb.image ? { backgroundImage: `url(${item.thumb.image})` } : { background: item.thumb.bg }}
            >
              {item.thumb.image ? null : item.thumb.emoji}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-black text-[15px] text-ink">{item.title}</span>
              <span className="block text-xs text-muted mt-0.5 mb-1.5">{item.desc}</span>
              {item.chip && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-vermilion/10 text-vermilion">{item.chip}</span>}
            </span>
            <span aria-hidden className="text-muted pr-1">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

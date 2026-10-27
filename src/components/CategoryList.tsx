import { Fragment } from "react";
import Link from "next/link";
import type { CategoryItem } from "@/content/navigation";
import { Icon } from "@/components/icons";

// 묶음 항목 목록 (썸네일 + 제목 + 설명 + 칩) — 홈 묶음 탭과 허브 페이지 공용. group이 바뀌는 곳에 소제목을 그린다
export default function CategoryList({ items }: { items: CategoryItem[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <Fragment key={item.href}>
        {item.group && item.group !== items[i - 1]?.group && (
          <li className={i > 0 ? "mt-3" : undefined}><h3 className="text-[13px] font-medium text-muted px-1">{item.group}</h3></li>
        )}
        <li>
          <Link href={item.href} className="flex gap-3 items-center bg-white border border-line rounded-[22px] p-2.5 hover:border-accent/50 transition">
            <span
              aria-hidden
              className="w-16 h-16 flex-none rounded-2xl grid place-items-center text-ink bg-cover bg-top"
              style={item.thumb.image ? { backgroundImage: `url(${item.thumb.image})` } : { background: item.thumb.bg }}
            >
              {item.thumb.image || !item.thumb.icon ? null : <Icon name={item.thumb.icon} size={28} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[15px] text-ink">{item.title}</span>
              <span className="block text-xs text-muted mt-0.5 mb-1.5">{item.desc}</span>
              {item.chip && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-card-2 text-accent">{item.chip}</span>}
            </span>
            <Icon name="chevron" size={18} className="text-muted mr-1 flex-none" />
          </Link>
        </li>
        </Fragment>
      ))}
    </ul>
  );
}

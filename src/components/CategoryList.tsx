import { Fragment } from "react";
import Link from "next/link";
import type { CategoryItem } from "@/content/navigation";
import { Icon } from "@/components/icons";
import { portraitThumb } from "@/lib/portraitThumb";

// 묶음 항목 목록 (썸네일 + 제목 + 설명 + 칩) — 홈 묶음 탭과 허브 페이지 공용. group이 바뀌는 곳에 소제목을 그린다
export default function CategoryList({ items, hidden }: { items: CategoryItem[]; hidden?: (item: CategoryItem) => boolean }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <Fragment key={item.href}>
        {item.group && item.group !== items[i - 1]?.group && (
          <li className={i > 0 ? "mt-3" : undefined}><h3 className="text-[13px] font-medium text-muted px-1">{item.group}</h3></li>
        )}
        <li hidden={hidden?.(item) || undefined} className={i < 6 ? "rise" : undefined} style={i < 6 ? ({ "--i": i } as React.CSSProperties) : undefined}>
          <Link href={item.href} className="press flex gap-3 items-center bg-card border border-line rounded-[22px] p-2.5 hover:border-accent/50 transition">
            {item.thumb.image && item.thumb.alt ? (
              // 캐릭터 얼굴: 이미지 검색에 잡히도록 alt와 크기를 둔다
              <img src={item.thumb.image} alt={item.thumb.alt} width={64} height={64} loading="lazy" decoding="async" className="w-16 h-16 flex-none rounded-2xl object-cover" style={{ background: item.thumb.bg }} />
            ) : (
              <span
                aria-hidden
                className="w-16 h-16 flex-none rounded-2xl grid place-items-center text-ink bg-cover bg-top"
                style={item.thumb.image ? { backgroundImage: `url(${portraitThumb(item.thumb.image)})` } : { background: item.thumb.bg }}
              >
                {item.thumb.image || !item.thumb.icon ? null : <Icon name={item.thumb.icon} size={28} />}
              </span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[15px] text-ink">{item.title}</span>
              <span className="block text-xs text-muted mt-0.5 mb-1.5">{item.desc}</span>
              {item.chip && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-card-2 text-accent-ink">{item.chip}</span>}
            </span>
            <Icon name="chevron" size={18} className="text-muted mr-1 flex-none" />
          </Link>
        </li>
        </Fragment>
      ))}
    </ul>
  );
}

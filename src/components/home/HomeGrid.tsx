"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { CategoryItem, Tag } from "@/content/navigation";
import { portraitThumb } from "@/lib/portraitThumb";
import { Icon } from "@/components/icons";
import { t } from "@/lib/i18n/dict";
import type { Locale } from "@/lib/i18n/locales";

const CHIPS: { key: "all" | Tag; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "face", label: "얼굴" },
  { key: "fortune", label: "운세" },
  { key: "match", label: "궁합" },
  { key: "play", label: "게임" },
];

// 처음에 보이는 8개(서버 HTML에는 나머지도 모두 있고 hidden으로만 가린다)
export const HOME_DEFAULT = ["/face2", "/animal", "/face-match", "/fortune/daily", "/bujeok", "/exam/meme", "/samguk", "/saju"];

/** 칩 하나에서 보일 항목: 전체는 기본 8개, 나머지는 그 태그 항목 전부 */
export function visibleFor(chip: "all" | Tag, item: CategoryItem): boolean {
  return chip === "all" ? HOME_DEFAULT.includes(item.href) : item.tags.includes(chip);
}

// 칩 줄 + (대표 카드·시즌 띠: children) + 카드 2열. 칩은 이동이 아니라 카드만 거른다.
export default function HomeGrid({ items, children, locale = "ko" }: { items: CategoryItem[]; children: ReactNode; locale?: Locale }) {
  const [chip, setChip] = useState<"all" | Tag>("all");
  const en = locale === "en";
  // 영어판은 테스트가 적어 칩 없이 전부 보인다
  const ordered = en ? items : [...HOME_DEFAULT.map((h) => items.find((i) => i.href === h)!), ...items.filter((i) => !HOME_DEFAULT.includes(i.href))];
  return (
    <div className="space-y-3">
      {!en && <div role="group" aria-label="테스트 종류" className="flex gap-2 overflow-x-auto [scrollbar-width:none] -mx-4 px-4">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={chip === c.key}
            onClick={() => setChip(c.key)}
            className={`press flex-none h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${chip === c.key ? "bg-ink text-paper border-ink" : "bg-card text-ink border-line"}`}
          >
            {c.label}
          </button>
        ))}
      </div>}
      {children}
      <ul aria-label={t(locale, "home.cardsAria")} className="grid grid-cols-2 gap-2.5">
        {ordered.map((item, n) => {
          const shown = en || visibleFor(chip, item);
          const portrait = item.thumb.image && !item.thumb.alt;
          return (
            <li key={item.href} hidden={!shown} data-home-card={item.href} className={n < 6 ? "rise" : undefined} style={{ "--i": n + 3 } as React.CSSProperties}>
              <Link href={item.href} className="press relative block h-full min-h-[176px] overflow-hidden rounded-[24px] bg-card border border-line p-4">
                {item.thumb.bg && (
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[46%]" style={{ background: `${item.thumb.bg}2E` }} />
                )}
                <span className="relative block text-base font-bold tracking-tight break-keep pr-1">{item.title}</span>
                <span className="relative block text-[12.5px] leading-snug text-muted mt-1 line-clamp-2">{item.desc}</span>
                {item.thumb.image ? (
                  <img
                    src={portrait ? portraitThumb(item.thumb.image) : item.thumb.image}
                    alt={item.thumb.alt ?? ""}
                    width={76}
                    height={76}
                    loading="lazy"
                    decoding="async"
                    className={`absolute right-2.5 bottom-2.5 w-[76px] h-[76px] rounded-[24px] object-cover ${portrait ? "object-top" : ""}`}
                    style={item.thumb.bg ? { background: item.thumb.bg } : undefined}
                  />
                ) : (
                  <span aria-hidden className="absolute right-2.5 bottom-2.5 w-[76px] h-[76px] rounded-[24px] grid place-items-center bg-card-2 text-ink">
                    {item.thumb.icon && <Icon name={item.thumb.icon} size={30} />}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

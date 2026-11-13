"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { CategoryItem, Tag } from "@/content/navigation";
import { portraitThumb } from "@/lib/portraitThumb";
import { Icon } from "@/components/icons";
import { CAST, type CastKey } from "@/content/cast";
import { HOME_ART } from "@/content/homeArt";
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

// 캐릭터 얼굴 썸네일(/images/cast/<키>-face.webp)이 있는 항목은 큰 캐릭터 카드로 그린다
function castOf(item: CategoryItem): CastKey | null {
  const m = item.thumb.alt && item.thumb.image?.match(/\/images\/cast\/([A-Za-z]+)-face\.webp$/);
  return m && m[1] in CAST ? (m[1] as CastKey) : null;
}

const KIND_KEY = { face: "chip.face", fortune: "chip.fortune", match: "chip.match", play: "chip.play" } as const;
function kindLabel(item: CategoryItem, locale: Locale): string {
  return t(locale, KIND_KEY[item.tags[0]]);
}

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
      {!en && <div role="group" aria-label="테스트 종류" className="flex gap-[22px] overflow-x-auto [scrollbar-width:none] -mx-4 px-4 border-b border-line">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={chip === c.key}
            onClick={() => setChip(c.key)}
            className={`flex-none h-11 text-[15px] border-b-2 -mb-px transition-colors ${chip === c.key ? "text-ink border-ink font-bold" : "text-muted border-transparent"}`}
          >
            {c.label}
          </button>
        ))}
      </div>}
      {children}
      <h2 className="font-serif font-extrabold text-[19px] tracking-tight px-1 pt-3">{t(locale, "home.askWho")}</h2>
      <ul aria-label={t(locale, "home.cardsAria")} className="grid grid-cols-2 gap-3">
        {ordered.map((item, n) => {
          const shown = en || visibleFor(chip, item);
          const portrait = item.thumb.image && !item.thumb.alt;
          const castKey = castOf(item);
          const homeArt = HOME_ART[item.href];
          const art = homeArt
            ? { src: homeArt.src, bg: "#151A38", name: homeArt.type }
            : castKey
              ? { src: CAST[castKey].img, bg: CAST[castKey].bg, name: en ? CAST[castKey].en : CAST[castKey].name }
              : null;
          return (
            <li key={item.href} hidden={!shown} data-home-card={item.href} className={n < 6 ? "rise" : undefined} style={{ "--i": n + 3 } as React.CSSProperties}>
              {art ? (
                <Link href={item.href} className="press relative block h-full min-h-[236px] overflow-hidden rounded-[18px] bg-card border border-line">
                  <img
                    src={art.src}
                    alt={item.thumb.alt ?? ""}
                    width={720}
                    height={960}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
                    style={{ background: art.bg }}
                  />
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[130px] bg-gradient-to-b from-transparent to-paper" />
                  <span className="absolute left-3 right-3 bottom-3 flex flex-col gap-[3px]">
                    <span className="text-xs text-accent-ink">{art.name} · {kindLabel(item, locale)}</span>
                    <span className="text-[15px] font-bold leading-[1.35] break-keep">{item.title}</span>
                    <span className="sr-only">{item.desc}</span>
                  </span>
                </Link>
              ) : (
              <Link href={item.href} className="press relative block h-full min-h-[236px] overflow-hidden rounded-[18px] bg-card border border-line p-4">
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
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

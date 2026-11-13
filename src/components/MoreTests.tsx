import Link from "next/link";
import { ALL_ITEMS } from "@/content/navigation";
import { EN_ITEMS } from "@/lib/i18n/enItems";
import { t } from "@/lib/i18n/dict";
import { localePath, type Locale } from "@/lib/i18n/locales";

// "다른 테스트 둘러보기": 검색으로 바로 들어온 사람이 탭바 말고도 다른 테스트로 갈 수 있게 한다.
// 시작 화면 맨 아래와 결과 화면 공유 버튼 묶음 아래에 놓이며 결과 캡처에서는 빠진다.
export default function MoreTests({ current, className = "mt-6", locale = "ko" }: { current: string; className?: string; locale?: Locale }) {
  const path = current.split(/[?#]/)[0];
  const items = (locale === "ko" ? ALL_ITEMS : EN_ITEMS).filter((i) => i.href !== path).slice(0, 4);
  return (
    <section aria-labelledby="more-tests-title" className={`no-screenshot ${className}`}>
      <div className="flex items-baseline justify-between px-1">
        <h2 id="more-tests-title" className="text-sm font-bold">{t(locale, "more.title")}</h2>
        <Link href={localePath(locale, "/all")} className="text-[13px] text-accent-ink font-semibold">{t(locale, "btn.seeAll")}</Link>
      </div>
      <ul className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 mt-2.5">
        {items.map((i) => (
          <li key={i.href} className="flex-none w-[148px]">
            <Link href={i.href} className="press flex h-full flex-col gap-2 rounded-[20px] bg-card border border-line p-3">
              {i.thumb.image && i.thumb.alt ? (
                <img src={i.thumb.image} alt={i.thumb.alt} width={44} height={44} loading="lazy" decoding="async" className="w-11 h-11 rounded-[14px] object-cover" style={{ background: i.thumb.bg }} />
              ) : null}
              <span className="text-[14px] font-bold break-keep">{i.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

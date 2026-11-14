// 테스트 시작 화면 머리: 왼쪽 캐릭터 세로 카드(3:4, 112px) + 오른쪽 제목(h2)·말풍선.
// 11/14 사용자 "첫 화면에 나와야 한다, 스크롤을 누가 하겠어": 너비 가득 그림(4:3 → 2:1)도 실제 사파리 높이(약 664px)에서 버튼을 밀어내서,
// 그림을 옆 카드로 바꾸고 제목을 그 옆에 둔다(e2e/start-fold.spec.ts가 390×664·375×667에서 분석 버튼이 탭바 위에 보이는지 잰다).
// 서버·클라이언트 어디서나 쓴다(훅 없음).
import type { ReactNode } from 'react'
import { CAST, type CastKey } from '@/content/cast'
import type { LineKey } from '@/content/castLines'
import { t } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'

export default function CastHero({ cast, lineKey, locale = 'ko', priority = true, heading }: { cast: CastKey; lineKey: LineKey; locale?: Locale; priority?: boolean; heading?: ReactNode }) {
  const c = CAST[cast]
  const name = locale === 'en' ? c.en : c.name
  return (
    <div className="flex gap-3.5 items-center mt-1" data-cast-hero={cast}>
      <div className="relative flex-none w-[112px] aspect-[3/4] overflow-hidden rounded-[20px] border border-line" style={{ background: c.bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.img}
          alt={`${name} ${t(locale, 'cast.alt')}`}
          width={720}
          height={960}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1" data-cast-say={lineKey}>
        {heading && <h2 className="font-serif font-bold text-[20px] leading-[1.3] break-keep whitespace-pre-line">{heading}</h2>}
        <p className={`${heading ? 'mt-2' : ''} text-[11px] text-muted`}>{name}</p>
        <p className="mt-1 px-3 py-2.5 rounded-[4px_16px_16px_16px] bg-card border border-line text-[13px] leading-[1.5] break-keep">{t(locale, lineKey)}</p>
      </div>
    </div>
  )
}

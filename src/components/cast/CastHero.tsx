// 테스트 시작 화면 위쪽의 캐릭터 큰 그림(3:4 원본을 4:3으로 위 기준, 얼굴이 보이게) + 아래 그라데이션 위의 말풍선.
// 화면 좌우 여백(22px)을 뚫고 너비 가득. 서버·클라이언트 어디서나 쓴다(훅 없음). h1·설명 문구는 이 컴포넌트가 대신하지 않는다.
import { CAST, type CastKey } from '@/content/cast'
import type { LineKey } from '@/content/castLines'
import { t } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import CastSay from '@/components/cast/CastSay'

export default function CastHero({ cast, lineKey, locale = 'ko', priority = true }: { cast: CastKey; lineKey: LineKey; locale?: Locale; priority?: boolean }) {
  const c = CAST[cast]
  const name = locale === 'en' ? c.en : c.name
  return (
    <div className="relative -mx-[22px]" data-cast-hero={cast}>
      <div className="relative overflow-hidden aspect-[4/3]" style={{ background: c.bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.img}
          alt={`${name} ${t(locale, 'cast.alt')}`}
          width={720}
          height={960}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-x-0 top-0 w-full h-auto"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[40%]" style={{ background: 'linear-gradient(180deg, rgba(11,16,38,0), rgba(11,16,38,0.85) 65%, var(--color-paper))' }} />
      </div>
      {/* 말풍선은 그림 아래쪽(몸통)에만 살짝 겹친다. 얼굴을 가리지 않게(11/14 사용자 확인) */}
      <div className="relative -mt-14 px-[22px]">
        <CastSay cast={cast} lineKey={lineKey} size="sm" locale={locale} />
      </div>
    </div>
  )
}

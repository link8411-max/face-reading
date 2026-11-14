// 테스트 시작 화면 위쪽의 캐릭터 그림. 3:4 원본을 2:1 띠로 잘라(얼굴이 띠 높이의 40% 자리에 오게) + 아래 그라데이션 위의 말풍선.
// 11/14 사용자 "캐릭터 때문에 메뉴가 너무 밀렸다"로 4:3 → 2:1(390px 폭에서 약 195px)로 낮췄다. 얼굴 위치는 webtoon-crops.json의 cy.
// 화면 좌우 여백(22px)을 뚫고 너비 가득. 서버·클라이언트 어디서나 쓴다(훅 없음). h1·설명 문구는 이 컴포넌트가 대신하지 않는다.
import { CAST, type CastKey } from '@/content/cast'
import type { LineKey } from '@/content/castLines'
import { t } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'
import CastSay from '@/components/cast/CastSay'

// 원본 그림에서 얼굴 중심의 세로 위치(0~1, scripts/webtoon-crops.json의 cy, 백호는 기본값)
export const HERO_FACE_Y: Record<CastKey, number> = {
  haetae: 0.2, saja: 0.29, gumiho: 0.21, mudang: 0.22, tiger: 0.22, dokkaebi: 0.2, sajaF: 0.305, sajaElder: 0.315, baksu: 0.245,
}

// 2:1 띠(높이 H = 폭/2) 안에서 폭 W·높이 4/3W인 그림의 얼굴 중심을 0.4H에 둔다: top = 0.4H − cy·(4/3)W = (0.2 − 4/3·cy)W → H 기준 %
export function heroTop(cy: number): string {
  const pct = (0.2 - (4 / 3) * cy) * 200
  return `${Math.min(0, Math.max(-166, pct)).toFixed(1)}%`
}

export default function CastHero({ cast, lineKey, locale = 'ko', priority = true }: { cast: CastKey; lineKey: LineKey; locale?: Locale; priority?: boolean }) {
  const c = CAST[cast]
  const name = locale === 'en' ? c.en : c.name
  return (
    <div className="relative -mx-[22px]" data-cast-hero={cast}>
      <div className="relative overflow-hidden aspect-[2/1]" style={{ background: c.bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={c.img}
          alt={`${name} ${t(locale, 'cast.alt')}`}
          width={720}
          height={960}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="absolute inset-x-0 w-full h-auto"
          style={{ top: heroTop(HERO_FACE_Y[cast]) }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[45%]" style={{ background: 'linear-gradient(180deg, rgba(11,16,38,0), rgba(11,16,38,0.85) 65%, var(--color-paper))' }} />
      </div>
      {/* 말풍선은 그림 아래쪽에만 살짝 겹친다. 얼굴을 가리지 않게 */}
      <div className="relative -mt-9 px-[22px]">
        <CastSay cast={cast} lineKey={lineKey} size="sm" locale={locale} />
      </div>
    </div>
  )
}

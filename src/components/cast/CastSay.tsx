// 캐릭터 말풍선: 왼쪽 둥근 얼굴 + 이름(작게) + 말풍선. 서버·클라이언트 어디서나 쓴다(훅 없음, 언어는 prop).
import { CAST, type CastKey } from '@/content/cast'
import { CAST_LINES, type LineKey } from '@/content/castLines'
import { t } from '@/lib/i18n/dict'
import type { Locale } from '@/lib/i18n/locales'

// 얼굴 테두리 색(캐릭터 색, 시안 값). 어두운 바탕에서 보이는 밝기로.
const RING: Record<CastKey, string> = {
  haetae: '#E7A93A',
  saja: '#3E5BFF',
  gumiho: '#E8704A',
  mudang: '#C8372D',
  tiger: '#A7B4C6',
  dokkaebi: '#3FAE8A',
}

export default function CastSay({ cast, lineKey, size = 'md', locale = 'ko' }: { cast?: CastKey; lineKey: LineKey; size?: 'sm' | 'md'; locale?: Locale }) {
  const key = cast ?? CAST_LINES[lineKey]
  const c = CAST[key]
  const px = size === 'sm' ? 40 : 56
  const name = locale === 'en' ? c.en : c.name
  return (
    <div className="flex gap-3 items-start" data-cast-say={lineKey}>
      <img
        src={c.face}
        alt={`${name} ${t(locale, 'cast.alt')}`}
        width={px}
        height={px}
        className="flex-none rounded-full object-cover border-2"
        style={{ width: px, height: px, background: c.bg, borderColor: RING[key] }}
      />
      <div className="min-w-0">
        <p className="text-[11px] text-muted mb-1">{name}</p>
        <p className={`px-3.5 py-3 rounded-[4px_18px_18px_18px] bg-card border border-line leading-[1.6] break-keep ${size === 'sm' ? 'text-sm' : 'text-[15px]'}`}>{t(locale, lineKey)}</p>
      </div>
    </div>
  )
}

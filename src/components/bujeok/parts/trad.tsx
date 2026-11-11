// 전통 화풍: 노란 종이에 붉은 붓선. 몸통 문양은 기운, 가운데 상징은 소원, 테두리·머리 문양은 변형 번호가 정한다.
import { partsFor } from '@/lib/bujeok/compose'
import type { ElKey, Wish } from '@/lib/bujeok/keys'
import { EL_COLOR, themeFor } from '@/lib/bujeok/palette'
import { EL_TEXT, WISH_TEXT } from '@/content/bujeok'
import GoldDefs from './GoldDefs'
import { ring, stampChars, type KitProps } from './types'

const SERIF = { fontFamily: 'var(--font-gowun-batang), "Noto Serif KR", serif' }

const BODY: Record<ElKey, string[]> = {
  wood: ['M150 152 L110 128', 'M150 152 L190 128', 'M150 204 L102 174', 'M150 204 L198 174', 'M150 256 L110 230', 'M150 256 L190 230'],
  fire: ['M106 288 L124 238 L112 202 L136 150 L150 192 L164 150 L188 202 L176 238 L194 288'],
  earth: ['M98 140 H202 V176 H98 V212 H202 V248 H98 V284'],
  metal: ['M150 124 L198 206 L150 288 L102 206 Z', 'M150 160 L176 206 L150 252 L124 206 Z'],
  water: ['M100 150 Q125 126 150 150 T200 150', 'M100 204 Q125 180 150 204 T200 204', 'M100 258 Q125 234 150 258 T200 258'],
}

const SYMBOL: Record<Wish, string[]> = {
  money: ['M132 327 H168 V363 H132 Z'],
  pass: ['M150 372 V318', 'M130 340 L150 318 L170 340'],
  health: [ring(150, 331, 9), ring(150, 357, 15)],
  love: [ring(139, 345, 14), ring(161, 345, 14)],
  guard: ['M130 368 V326 H170 V368', 'M130 346 H170'],
}

export default function TradBujeok({ spec, name, lite }: KitProps) {
  const { border, head } = partsFor(spec)
  const t = themeFor('trad', spec.finish)
  const J = t.line
  const w = WISH_TEXT[spec.wish]
  const chars = stampChars(name)
  const cols = chars.length > 3 ? 2 : 1
  const rows = Math.ceil(chars.length / cols)
  const sw = cols * 20 + 14
  const sh = rows * 20 + 14
  const sx = 246 - sw
  const sy = 490 - sh
  const brush = lite ? undefined : 'url(#bujeok-brush)'
  const line = { fill: 'none', stroke: J, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <>
      {(!lite || t.foil) && (
        <defs>
          {t.foil && <GoldDefs finish={spec.finish} />}
          {!lite && (
            <>
          <filter id="bujeok-brush" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="3.2" />
          </filter>
          <filter id={t.ids.grain}>
            <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" />
            <feColorMatrix values={t.grain} />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
          <linearGradient id={t.ids.edge} x1="0" x2="1">
            <stop offset="0" stopColor={t.edge} stopOpacity=".55" />
            <stop offset=".12" stopColor={t.edge} stopOpacity="0" />
            <stop offset=".88" stopColor={t.edge} stopOpacity="0" />
            <stop offset="1" stopColor={t.edge} stopOpacity=".55" />
          </linearGradient>
            </>
          )}
        </defs>
      )}
      <rect x="30" y="6" width="240" height="508" fill={t.paper} />
      {!lite && <rect x="30" y="6" width="240" height="508" fill={`url(#${t.ids.edge})`} />}
      {!lite && <rect x="30" y="6" width="240" height="508" filter={`url(#${t.ids.grain})`} />}

      <g {...line} filter={brush}>
        {border === 0 ? (
          <>
            <rect data-a="draw" data-part="border" data-d="700" x="42" y="18" width="216" height="484" strokeWidth="3" />
            <rect data-a="draw" data-d="600" x="49" y="25" width="202" height="470" strokeWidth="1.2" />
          </>
        ) : (
          <>
            <rect data-a="draw" data-part="border" data-d="700" x="44" y="20" width="212" height="480" strokeWidth="4" />
            <path data-a="draw" d="M52 28 h14 v14 h-14 z M234 28 h14 v14 h-14 z M52 478 h14 v14 h-14 z M234 478 h14 v14 h-14 z" strokeWidth="2" />
          </>
        )}

        {head === 0 ? (
          <>
            <path data-a="draw" data-part="head" d="M118 64 Q150 32 182 64" strokeWidth="4" />
            <circle data-a="pop" cx="118" cy="64" r="6" fill={J} stroke="none" />
            <circle data-a="pop" cx="150" cy="48" r="6" fill={J} stroke="none" />
            <circle data-a="pop" cx="182" cy="64" r="6" fill={J} stroke="none" />
          </>
        ) : (
          <>
            <path data-a="draw" data-part="head" d={ring(122, 56, 11)} strokeWidth="4" />
            <path data-a="draw" d="M135 56 H162" strokeWidth="3" />
            <path data-a="draw" d="M186 45 a12 12 0 1 0 0 22 a9 9 0 1 1 0 -22" strokeWidth="4" />
          </>
        )}

        <path data-a="draw" data-part="body" d="M92 98 Q150 78 208 98" strokeWidth="7" />
        <path data-a="draw" d="M112 106 v10 M150 102 v14 M188 106 v10" strokeWidth="5" />
        {BODY[spec.el].map((d) => (
          <path key={d} data-a="draw" d={d} strokeWidth="6.5" />
        ))}
        <path data-a="draw" d="M150 112 V300" strokeWidth="9" />

        <path data-a="draw" data-part="symbol" d={ring(150, 345, 38)} strokeWidth="7" />
        {SYMBOL[spec.wish].map((d) => (
          <path key={d} data-a="draw" d={d} strokeWidth="6" />
        ))}
        <path data-a="draw" d="M78 345 Q58 345 64 320 M222 345 Q242 345 236 320" strokeWidth="5" />
        <path data-a="draw" d="M150 383 V396 Q150 412 136 412 Q124 412 124 402 Q124 394 134 395" strokeWidth="5" />
      </g>

      <g data-part="phrase" aria-label={w.hanja}>
        {[...w.hanja].map((c, i) => (
          <text key={i} data-a="fade" x={72 + i * 34} y="452" textAnchor="middle" fontSize="26" fontWeight="700" fill={J} style={SERIF}>
            {c}
          </text>
        ))}
      </g>
      <circle data-a="pop" cx="62" cy="479" r="6" fill={EL_COLOR[spec.el]} />
      <text data-a="fade" x="74" y="483" fontSize="11" fill={J} style={SERIF}>
        {EL_TEXT[spec.el].name}
      </text>

      <g data-a="stamp" data-part="stamp">
        <rect x={sx} y={sy} width={sw} height={sh} rx="3" fill={t.stampFill} filter={brush} />
        {chars.map((c, i) => (
          <text
            key={i}
            x={sx + 7 + (cols - 1 - Math.floor(i / rows)) * 20 + 10}
            y={sy + 7 + (i % rows) * 20 + 16}
            textAnchor="middle"
            fontSize="17"
            fontWeight="700"
            fill={t.stampInk}
            style={SERIF}
          >
            {c}
          </text>
        ))}
      </g>
    </>
  )
}

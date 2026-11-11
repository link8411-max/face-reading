// 귀여운 화풍: 밝은 종이에 캐릭터. 캐릭터는 소원, 둘레 장식은 기운, 테두리·머리말 모양은 변형 번호가 정한다.
import type { ReactNode } from 'react'
import { partsFor } from '@/lib/bujeok/compose'
import type { ElKey, Wish } from '@/lib/bujeok/keys'
import { EL_COLOR_CUTE, MASCOT_COLOR, PAL, themeFor } from '@/lib/bujeok/palette'
import { EL_TEXT, WISH_TEXT } from '@/content/bujeok'
import GoldDefs from './GoldDefs'
import type { KitProps } from './types'

const INK = PAL.cuteInk
const ROUND = { fontFamily: 'var(--font-noto-sans-kr), sans-serif', paintOrder: 'stroke' as const }

const DECO: Record<ElKey, string> = {
  wood: 'M0 -11 Q10 -2 0 11 Q-10 -2 0 -11Z',
  fire: 'M0 -12 Q10 -2 6 6 Q4 11 0 11 Q-4 11 -6 6 Q-10 -2 0 -12Z',
  earth: 'M-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
  metal: 'M0 -11 Q1.5 -1.5 11 0 Q1.5 1.5 0 11 Q-1.5 1.5 -11 0 Q-1.5 -1.5 0 -11Z',
  water: 'M0 -12 Q9 1 6 6 Q3 11 0 11 Q-3 11 -6 6 Q-9 1 0 -12Z',
}
const DECO_AT: [number, number, number][] = [[64, 176, 1.3], [238, 186, 1], [56, 300, 0.9], [244, 312, 1.3], [92, 366, 0.8], [210, 370, 1]]

function star(cx: number, cy: number, ro: number, ri: number) {
  const p: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? ri : ro
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    p.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return `M${p.join(' L')} Z`
}

const body = { stroke: INK, strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** 캐릭터 몸. faceY는 눈높이 */
const MASCOT: Record<Wish, { faceY: number; draw: (fill: string) => ReactNode }> = {
  money: {
    faceY: 256,
    draw: (fill) => (
      <>
        <path data-a="pop" {...body} fill={fill} d="M88 300 C70 222 112 196 150 196 C188 196 230 222 212 300 C204 352 96 352 88 300 Z" />
        <path data-a="draw" {...body} fill={PAL.cutePaper} d="M126 196 C112 170 134 158 150 176 C166 158 188 170 174 196" />
        <path data-a="draw" {...body} fill="none" stroke={PAL.cuteTag} d="M122 198 H178" />
      </>
    ),
  },
  pass: {
    faceY: 266,
    draw: (fill) => <path data-a="pop" {...body} strokeWidth={10} fill={fill} d={star(150, 272, 74, 40)} />,
  },
  health: {
    faceY: 270,
    draw: (fill) => (
      <>
        <path data-a="pop" {...body} fill={fill} d="M150 210 C198 196 228 250 210 302 C198 340 102 340 90 302 C72 250 102 196 150 210 Z" />
        <path data-a="draw" {...body} fill="#9AD9A6" d="M150 208 Q160 178 186 182 Q180 208 150 208 Z" />
      </>
    ),
  },
  love: {
    faceY: 252,
    draw: (fill) => (
      <path data-a="pop" {...body} fill={fill} d="M150 340 C86 296 78 232 114 214 C134 204 148 218 150 234 C152 218 166 204 186 214 C222 232 214 296 150 340 Z" />
    ),
  },
  guard: {
    faceY: 272,
    draw: (fill) => (
      <>
        <circle data-a="pop" {...body} fill={fill} cx="106" cy="224" r="15" />
        <circle data-a="pop" {...body} fill={fill} cx="194" cy="224" r="15" />
        <path data-a="pop" {...body} fill={fill} d="M90 278 C90 232 118 210 150 210 C182 210 210 232 210 278 C210 318 182 340 150 340 C118 340 90 318 90 278 Z" />
        <path data-a="draw" {...body} strokeWidth={5} fill="none" d="M150 213 v17 M133 217 l4 14 M167 217 l-4 14" />
        <path data-a="draw" {...body} strokeWidth={3.5} fill="none" d="M98 292 h-16 M100 302 l-15 5 M202 292 h16 M200 302 l15 5" />
      </>
    ),
  },
}

export default function CuteBujeok({ spec, name }: KitProps) {
  const { border, head } = partsFor(spec)
  const t = themeFor('cute', spec.finish)
  const w = WISH_TEXT[spec.wish]
  const m = MASCOT[spec.wish]
  const y = m.faceY
  const phraseSize = [...w.cutePhrase].length > 6 ? 27 : 33
  const tag = name ? `${name} 꺼` : '복'
  const tagSize = Math.min(24, Math.floor(200 / Math.max(4, [...tag].length)))
  const tagW = Math.max(84, [...tag].length * tagSize * 0.92 + 36)
  return (
    <>
      {t.foil && <defs><GoldDefs finish={spec.finish} /></defs>}
      <rect x="24" y="6" width="252" height="508" rx="34" fill={t.paper} />
      {border === 0 ? (
        <rect data-a="fade" data-part="border" x="36" y="18" width="228" height="484" rx="24" fill="none" stroke={t.line} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      ) : (
        <>
          <rect data-a="draw" data-part="border" data-d="800" x="35" y="17" width="230" height="486" rx="25" fill="none" stroke={t.line} strokeWidth="3" />
          <rect data-a="draw" data-d="600" x="43" y="25" width="214" height="470" rx="18" fill="none" stroke={t.line} strokeWidth="1.2" />
        </>
      )}

      {head === 1 && <rect data-a="pop" x="58" y="58" width="184" height="52" rx="26" fill={t.pill} />}
      <text data-a="fade" data-part="head" x="150" y="96" textAnchor="middle" fontSize={phraseSize} fontWeight="700" fill={t.head} stroke={t.head} strokeWidth="1.2" strokeLinejoin="round" style={ROUND}>
        {w.cutePhrase}
      </text>
      {head === 0 && <path data-a="draw" d="M84 112 Q150 126 216 112" fill="none" stroke={t.line} strokeWidth="5" strokeLinecap="round" />}

      <g className="bujeok-bob" data-part="symbol">
        {m.draw(MASCOT_COLOR[spec.wish])}
        <circle data-a="pop" cx="126" cy={y} r="6.5" fill={INK} />
        <circle data-a="pop" cx="174" cy={y} r="6.5" fill={INK} />
        <circle data-a="pop" cx="109" cy={y + 18} r="10" fill={PAL.cuteCheek} opacity=".7" />
        <circle data-a="pop" cx="191" cy={y + 18} r="10" fill={PAL.cuteCheek} opacity=".7" />
        <path data-a="draw" d={`M137 ${y + 15} Q150 ${y + 29} 163 ${y + 15}`} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </g>

      <g data-part="body">
        {DECO_AT.map(([x, yy, s], i) => (
          <path key={i} className="bujeok-tw" data-a="pop" transform={`translate(${x} ${yy}) scale(${s})`} d={DECO[spec.el]} fill={EL_COLOR_CUTE[spec.el]} />
        ))}
      </g>

      <text data-a="fade" data-part="phrase" x="150" y="402" textAnchor="middle" fontSize="14" fill={t.sub} style={ROUND}>
        {w.label} 부적 · {EL_TEXT[spec.el].name}
      </text>

      <g data-a="stamp" data-part="stamp">
        <rect x={150 - tagW / 2} y="424" width={tagW} height="46" rx="23" fill={PAL.cuteTag} />
        <text x="150" y={447 + tagSize * 0.36} textAnchor="middle" fontSize={tagSize} fontWeight="700" fill="#fff" style={ROUND}>
          {tag}
        </text>
      </g>
    </>
  )
}

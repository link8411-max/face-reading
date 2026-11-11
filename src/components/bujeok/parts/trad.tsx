// 전통 화풍(진지한 부적): 괴황지(노란 종이)에 주사로 쓴 부적. 시안 docs/bujeok/serious/art.js를 옮겼다.
// 위는 모든 소원 공통(雨 갓·三台), 가운데는 기운, 아래 상징은 소원, 몸통은 사용자가 긋는 마지막 한 획이다.
// 좌표는 시안의 240×508 종이 좌표이고 전체를 translate(30 6)으로 옮겨 CARD_BOX.trad(30,6,240,508)에 맞춘다.
import type { ReactNode } from 'react'
import { box, brush, rng, type Pt } from '@/lib/bujeok/brush'
import { partsFor } from '@/lib/bujeok/compose'
import { FOIL, PAL, goldId, themeFor } from '@/lib/bujeok/palette'
import { DEFAULT_SPINE, SPINE_BRUSH, SPINE_W, decodeStroke } from '@/lib/bujeok/stroke'
import { bottomStrokes, elementStrokes, symbolStrokes, topStrokes, type TStroke } from '@/lib/bujeok/talisman'
import { WISH_TEXT } from '@/content/bujeok'
import { stampChars, type KitProps } from './types'

const BRUSH_FONT = { fontFamily: 'var(--font-bujeok-brush), "Kaiti TC", serif' }
const SERIF = { fontFamily: 'var(--font-gowun-batang), "Noto Serif KR", serif' }

/** 글귀 줄 배치(왼쪽 세로줄): 4자는 간격 38·글자 28, 5자는 간격 34·글자 26. 첫 글자 y=190 */
export function phraseLayout(n: number): { x: number; y0: number; step: number; size: number } {
  return n > 4 ? { x: 42, y0: 190, step: 34, size: 26 } : { x: 42, y0: 190, step: 38, size: 28 }
}

export default function TradBujeok({ spec, name, lite, hideSpine, hideSeal, spine }: KitProps) {
  const { border, head } = partsFor(spec)
  const t = themeFor('trad', spec.finish)
  const f = spec.finish
  const gold = t.foil
  const id = (k: string) => `bujeok-${k}-${f}`
  const foil = `url(#${goldId(f)})`
  const ink = gold ? foil : PAL.tradInk
  const wish = WISH_TEXT[spec.wish]
  const vs = spec.variant * 31
  const filt = (k: string) => (lite ? undefined : `url(#${id(k)})`)

  const parts: TStroke[][] = [topStrokes(), elementStrokes(spec.el), symbolStrokes(spec.wish), bottomStrokes()]
  let n = 0
  const strokePaths = (list: TStroke[]) => list.map((s) => <path key={n} d={brush(s.pts, s.w, { seed: ++n + vs, start: s.start, end: s.end })} />)
  const [top, mid, sym, bot] = [strokePaths(parts[0]), strokePaths(parts[1]), strokePaths(parts[2]), strokePaths(parts[3])]

  const spinePts: Pt[] = spine ?? (spec.stroke ? decodeStroke(spec.stroke) : null) ?? DEFAULT_SPINE
  const spineD = spinePts.length >= 2 ? brush(spinePts, SPINE_W, SPINE_BRUSH) : null

  const frame = (m: number, w: number, seed: number) =>
    ([
      [[m, m + 2], [240 - m, m]],
      [[240 - m, m], [240 - m + 1, 508 - m]],
      [[240 - m + 1, 508 - m], [m, 508 - m - 1]],
      [[m, 508 - m - 1], [m, m + 2]],
    ] as Pt[][]).map((p, i) => <path key={`${m}-${i}`} d={brush(p, w, { seed: seed + i + vs, start: 0.9, end: 0.6 })} />)

  // 섬유(고정 시드): 종이는 160, 금박은 60, 작은 격자(lite)는 없음
  const fibers: ReactNode[] = []
  if (!lite) {
    const r = rng(42)
    for (let i = 0; i < (gold ? 60 : 160); i++) {
      const x = r() * 240, y = r() * 508, a = r() * Math.PI, l = 6 + r() * 22
      const cx = x + Math.cos(a) * l / 2 + (r() - 0.5) * 6, cy = y + Math.sin(a) * l / 2 + (r() - 0.5) * 6
      const light = r() < 0.35
      fibers.push(
        <path
          key={i}
          d={`M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${(x + Math.cos(a) * l).toFixed(1)} ${(y + Math.sin(a) * l).toFixed(1)}`}
          fill="none"
          stroke={gold ? (light ? '#4A3E2A' : '#000') : light ? '#FFF2C2' : '#A87A26'}
          strokeWidth={(0.3 + r() * 0.5).toFixed(2)}
          opacity={(0.12 + r() * 0.22).toFixed(2)}
        />,
      )
    }
  }

  const T = (c: string, x: number, y: number, size: number, extra: Record<string, string | number> = {}) => (
    <text key={`${c}${x}${y}`} x={x} y={y} fontSize={size} textAnchor="middle" fill={ink} style={BRUSH_FONT} {...extra}>
      {c}
    </text>
  )

  const pl = phraseLayout([...wish.hanja].length)
  const chars = name ? stampChars(name) : []
  const cols = chars.length > 3 ? 2 : 1
  const rows = Math.ceil(chars.length / cols)
  const sw = cols * 20 + 14
  const sh = rows * 20 + 14
  const sx = 214 - sw
  const sy = 490 - sh
  const sealFill = gold ? foil : PAL.tradSeal

  return (
    <>
      {(!lite || gold) && (
        <defs>
          {gold && (
            <linearGradient id={goldId(f)} x1="0" y1="0" x2="1" y2="1">
              {FOIL.tradStops.map((c, i) => (
                <stop key={i} offset={FOIL.tradAt[i]} stopColor={c} />
              ))}
            </linearGradient>
          )}
          {!lite && (
            <>
              <filter id={id('ink')} x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale={gold ? 2 : 3.2} result="d" />
                <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="g" />
                <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.75" result="ga" />
                <feComposite in="d" in2="ga" operator="in" />
              </filter>
              <filter id={id('edge')} x="-3%" y="-3%" width="106%" height="106%">
                <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
              </filter>
              <filter id={id('mottle')}>
                <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="5" />
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 ${gold ? 0.6 : 0.55}  0 0 0 0 ${gold ? 0.5 : 0.33}  0 0 0 0 ${gold ? 0.3 : 0.08}  ${gold ? '0 0 0 -1.4 0.95' : '0 0 0 -1.1 0.62'}`}
                />
              </filter>
              <radialGradient id={id('burn')} cx="50%" cy="48%" r="70%">
                <stop offset="62%" stopColor={gold ? '#000' : PAL.tradBurn} stopOpacity="0" />
                <stop offset="100%" stopColor={gold ? '#000' : PAL.tradBurn} stopOpacity={gold ? 0.55 : 0.42} />
              </radialGradient>
              <linearGradient id={id('paper')} x1="0" y1="0" x2="0.3" y2="1">
                {(gold ? FOIL.tradPaperStops : PAL.tradPaperStops).map((c, i, a) => (
                  <stop key={i} offset={a.length === 2 ? i : [0, 0.55, 1][i]} stopColor={c} />
                ))}
              </linearGradient>
              <clipPath id={id('clip')}>
                <rect x="4" y="4" width="232" height="500" rx="5" />
              </clipPath>
            </>
          )}
        </defs>
      )}
      <g transform="translate(30 6)">
        {/* 종이: 바닥은 한 색, 그 위에 거친 가장자리의 괴황지(또는 먹색 종이)·얼룩·섬유·그을림 */}
        <rect x="0" y="0" width="240" height="508" fill={t.paper} />
        {!lite && (
          <g clipPath={`url(#${id('clip')})`}>
            <rect x="4" y="4" width="232" height="500" rx="5" fill={`url(#${id('paper')})`} filter={filt('edge')} />
            <rect x="0" y="0" width="240" height="508" filter={filt('mottle')} style={{ mixBlendMode: 'multiply' }} />
            {fibers}
            <rect x="0" y="0" width="240" height="508" fill={`url(#${id('burn')})`} />
          </g>
        )}

        {/* 먹(주사) 층 */}
        <g filter={filt('ink')} fill={ink} style={gold || lite ? undefined : { mixBlendMode: 'multiply' }} opacity={gold ? 1 : 0.93}>
          <g data-part="border">
            {border === 0 ? (
              <>
                {frame(13, 3.2, 100)}
                {frame(19, 1.4, 200)}
              </>
            ) : (
              <>
                {frame(14, 5.2, 100)}
                {[[24, 24], [204, 24], [24, 472], [204, 472]].map(([x, y], i) => (
                  <path key={i} d={brush(box(x, y, 12), 2.6, { seed: 300 + i + vs, start: 0.8, end: 0.5 })} />
                ))}
              </>
            )}
          </g>
          <g data-part="head">
            {head === 0 ? (
              <>
                {T('日', 40, 62, 17)}
                {T('月', 200, 62, 17)}
              </>
            ) : (
              <>
                {/* 해: 동그라미 한 바퀴와 가운데 점 / 달: 왼쪽으로 볼록한 초승달 */}
                <path d={brush(Array.from({ length: 21 }, (_, i) => { const a = -Math.PI / 2 + (Math.PI * 1.7 * i) / 20; return [40 + 10 * Math.cos(a), 58 + 10 * Math.sin(a)] as Pt }), 3.4, { seed: 400 + vs, start: 0.7, end: 0.2 })} />
                <path d={brush([[40, 56], [40.5, 60]], 4.2, { seed: 401 + vs, start: 0.9, end: 0.7 })} />
                <path d={brush(Array.from({ length: 17 }, (_, i) => { const a = Math.PI * 0.32 + (Math.PI * 1.36 * i) / 16; return [203 + 11 * Math.cos(a), 58 + 12 * Math.sin(a)] as Pt }), 5.2, { seed: 402 + vs, start: 0.5, end: 0.1 })} />
              </>
            )}
          </g>
          <g data-part="body">
            {top}
            {mid}
            {!hideSpine && spineD && <path data-part="spine" d={spineD} />}
            {bot}
          </g>
          <g data-part="symbol">{sym}</g>
          <g data-part="title">{T('勅令', 120, 84, 54, { letterSpacing: -4, stroke: ink as string, strokeWidth: 1.4 })}</g>
          <g data-part="phrase" aria-label={wish.hanja}>
            {[...wish.hanja].map((c, i) => T(c, pl.x, pl.y0 + i * pl.step, pl.size))}
          </g>
          <g data-part="charm">{[...'急急如律令'].map((c, i) => T(c, 199, 180 + i * 31, 21))}</g>
        </g>

        {/* 吉 백문 도장 */}
        {!hideSeal && (
          <g data-part="seal" transform="rotate(-4 120 474)">
            <rect x="97" y="451" width="46" height="46" rx="3" fill={sealFill} filter={filt('ink')} opacity={gold ? 1 : 0.88} />
            <rect x="101" y="455" width="38" height="38" fill="none" stroke={gold ? FOIL.lacquer : '#E8C463'} strokeWidth="1.2" opacity="0.8" filter={filt('edge')} />
            <text x="120" y="488" fontSize="34" textAnchor="middle" fill={gold ? FOIL.lacquer : PAL.tradSealInk} stroke={gold ? FOIL.lacquer : PAL.tradSealInk} strokeWidth="0.9" filter={filt('edge')} style={BRUSH_FONT}>
              吉
            </text>
          </g>
        )}
        {/* 받는 사람 이름 도장(이름이 있을 때만) */}
        {!hideSeal && name && (
          <g data-part="stamp">
            <rect x={sx} y={sy} width={sw} height={sh} rx="3" fill={sealFill} filter={filt('edge')} opacity={gold ? 1 : 0.9} />
            {chars.map((c, i) => (
              <text
                key={i}
                x={sx + 7 + (cols - 1 - Math.floor(i / rows)) * 20 + 10}
                y={sy + 7 + (i % rows) * 20 + 16}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                fill={gold ? FOIL.lacquer : PAL.tradSealInk}
                style={SERIF}
              >
                {c}
              </text>
            ))}
          </g>
        )}
      </g>
    </>
  )
}

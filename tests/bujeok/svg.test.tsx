// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import BujeokSvg from '@/components/bujeok/BujeokSvg'
import { EL_KEYS, FINISHES, STYLES, VARIANTS, WISHES, type BujeokSpec } from '@/lib/bujeok/keys'
import { DEFAULT_SPINE, encodeStroke } from '@/lib/bujeok/stroke'
import { EL_COLOR, PAL } from '@/lib/bujeok/palette'
import { WISH_TEXT } from '@/content/bujeok'

const ALL: BujeokSpec[] = STYLES.flatMap((style) =>
  WISHES.flatMap((wish) => EL_KEYS.flatMap((el) => Array.from({ length: VARIANTS }, (_, variant) => FINISHES.map((finish) => ({ style, wish, el, variant, finish }))).flat())),
)
const html = (spec: BujeokSpec, name: string | null = '민지') => renderToStaticMarkup(<BujeokSvg spec={spec} name={name} />)
const dom = (spec: BujeokSpec, name: string | null = '민지') => {
  const d = document.createElement('div')
  d.innerHTML = html(spec, name)
  return d
}
const spec = (over: Partial<BujeokSpec> = {}): BujeokSpec => ({ style: 'trad', wish: 'money', el: 'metal', variant: 0, finish: 'paper', ...over })

test('1320개 조합 모두 렌더되고 viewBox가 0 0 300 520', () => {
  expect(ALL).toHaveLength(1320)
  const seen = new Set<string>()
  for (const s of ALL) {
    const h = html(s)
    expect(h).toContain('viewBox="0 0 300 520"')
    seen.add(h)
  }
  expect(seen.size).toBe(1320) // 조합마다(마감 포함) 그림이 다르다
})

test('그려지는 요소 순서: 귀여운은 처음이 테두리·마지막이 도장, 전통은 처음이 테두리', () => {
  for (const s of ALL.filter((x) => x.style === 'cute')) {
    const els = [...dom(s).querySelectorAll('[data-a]')]
    expect(els[0].getAttribute('data-part')).toBe('border')
    expect(els.at(-1)!.getAttribute('data-a')).toBe('stamp')
    expect(els.filter((e) => e.getAttribute('data-a') === 'stamp')).toHaveLength(1)
  }
  for (const s of ALL.filter((x) => x.style === 'trad')) {
    const parts = [...dom(s).querySelectorAll('[data-part]')].map((e) => e.getAttribute('data-part'))
    expect(parts[0]).toBe('border')
    expect(parts).toContain('seal')
  }
})

test('이름이 있으면 도장에 이름 글자가 있고, 없으면 귀여운은 "복", 전통은 이름 도장을 그리지 않는다', () => {
  expect(dom(spec({ style: 'cute' }), '민지').querySelector('[data-part=stamp]')!.textContent).toContain('민')
  expect(dom(spec({ style: 'cute' }), null).querySelector('[data-part=stamp]')!.textContent).toBe('복')
  expect(dom(spec(), '민지').querySelector('[data-part=stamp]')!.textContent).toContain('민')
  expect(dom(spec(), null).querySelector('[data-part=stamp]')).toBeNull()
  expect(dom(spec(), null).querySelector('[data-part=seal]')!.textContent).toBe('吉')
  // 전통 이름 도장은 공백을 빼고 네 글자까지
  expect(dom(spec(), '김 하늘이네').querySelector('[data-part=stamp]')!.textContent).toHaveLength(4)
})

test('전통 화풍에는 소원의 한자 글귀(4자, 가족 평안은 5자)가 순서대로 있다', () => {
  for (const wish of WISHES) expect(dom(spec({ wish })).querySelector('[data-part=phrase]')!.textContent).toBe(WISH_TEXT[wish].hanja)
})

test('귀여운 화풍에는 cutePhrase가 있다', () => {
  for (const wish of WISHES) expect(dom(spec({ style: 'cute', wish })).querySelector('[data-part=head]')!.textContent).toBe(WISH_TEXT[wish].cutePhrase)
})

test('이름은 글자로만 들어간다(마크업으로 해석되지 않는다)', () => {
  for (const style of STYLES) {
    const d = dom(spec({ style }), '<b>x</b>')
    expect(d.querySelector('b')).toBeNull()
  }
})

test('굵기 900과 금지 색이 SVG에 없다', () => {
  for (const s of ALL) {
    const h = html(s)
    expect(h).not.toMatch(/font-weight="900"|font-weight:\s*900/)
    expect(h).not.toMatch(/#(F5E6D3|C41E3A|E8D4C4|5C4033|FFD700|D4AF37|C8323E)/i)
  }
})

test('aria-label은 소원 이름 + 부적', () => {
  expect(html(spec({ wish: 'guard' }))).toContain('aria-label="액막이 부적"')
})

test('팔레트와 globals.css 토큰 값이 같다', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  expect(css).toContain(`--color-bujeok-paper: ${PAL.paper}`)
  expect(css).toContain(`--color-bujeok-jusa: ${PAL.jusa}`)
  expect(css).toContain(`--color-bujeok-ink: ${PAL.tradInk}`)
  expect(css).toContain(`--color-bujeok-seal: ${PAL.tradSeal}`)
  expect(css).toContain(`--color-bujeok-cute-paper: ${PAL.cutePaper}`)
  expect(css).toContain(`--color-bujeok-cute-ink: ${PAL.cuteInk}`)
  for (const el of EL_KEYS) expect(css).toContain(`--color-bujeok-el-${el}: ${EL_COLOR[el]}`)
})

const DARK_FINISHES = ['gold', 'holo'] as const
const BASE: Record<string, string> = { trad: '#17140F', cute: '#2b1d3a' }

test('금박·홀로그램에는 붉은 선과 붉은 바탕이 없고 바탕은 어두운 색이다', () => {
  for (const s of ALL.filter((x) => x.finish !== 'paper')) {
    const h = html(s)
    expect(h).not.toMatch(/#B3261E/i)
    const d = dom(s)
    const base = [...d.querySelectorAll('svg rect')].find((r) => !r.closest('defs')) // 첫 사각형이 바탕
    expect(base!.getAttribute('fill')?.toLowerCase()).toBe(BASE[s.style].toLowerCase())
    expect(h).toContain('url(#bujeok-gold-')
  }
})

test('종이 마감에는 금박 그라데이션이 없고 승인한 색 그대로다', () => {
  for (const s of ALL.filter((x) => x.finish === 'paper')) {
    const h = html(s)
    expect(h).not.toContain('bujeok-gold')
    expect(h).toContain(s.style === 'trad' ? PAL.paper : PAL.cutePaper)
  }
  expect(html(spec())).toContain(PAL.tradInk)
})

test('금박과 홀로그램의 SVG는 같고(무지갯빛은 겹침 층), 종이와는 다르다', () => {
  const g = html(spec({ finish: 'gold' }))
  const hl = html(spec({ finish: 'holo' }))
  expect(g.replaceAll('-holo', '-gold')).toBe(hl.replaceAll('-holo', '-gold'))
  expect(g).not.toBe(html(spec({ finish: 'paper' })))
})

test('한 화면에 마감이 다른 카드가 여러 장 있어도 gradient·filter id가 겹치지 않는다', () => {
  const ids = (finish: BujeokSpec['finish']) => [...html(spec({ finish })).matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => id !== 'bujeok-brush')
  const all = FINISHES.flatMap(ids)
  expect(new Set(all).size).toBe(all.length)
  for (const f of DARK_FINISHES) expect(ids(f).some((id) => id.includes('gold'))).toBe(true)
})

test('전통 글귀 줄(왼쪽 세로줄): 글자가 겹치지 않고 안쪽 테두리 안에 있으며 위에서 아래로 놓인다 (4자·5자 모두)', () => {
  for (const wish of WISHES) {
    const d = dom(spec({ wish }), null)
    const glyphs = [...d.querySelectorAll('[data-part=phrase] text')]
    expect(glyphs).toHaveLength([...WISH_TEXT[wish].hanja].length)
    const size = Number(glyphs[0].getAttribute('font-size'))
    let prevBottom = 0
    for (const g of glyphs) {
      const x = Number(g.getAttribute('x'))
      const y = Number(g.getAttribute('y'))
      expect(g.getAttribute('text-anchor')).toBe('middle')
      expect(x - size / 2, wish).toBeGreaterThanOrEqual(24) // 안쪽 테두리(x 19) 안
      expect(x + size / 2, wish).toBeLessThanOrEqual(68) // 가운데 상징(x 76~)과 닿지 않는다
      expect(y - size, wish).toBeGreaterThanOrEqual(prevBottom - 0.01)
      prevBottom = y
      expect(y, wish).toBeLessThanOrEqual(400) // 아래 吉 도장(y 451) 위
    }
  }
})

test('귀여운 캐릭터는 소원마다 다르고 비어 있지 않다. 전통 가운데 상징은 소원마다 다른 선을 더한다', () => {
  const cute = WISHES.map((wish) => dom(spec({ style: 'cute', wish }), null).querySelector('[data-part=symbol]')!.innerHTML)
  expect(new Set(cute).size).toBe(WISHES.length)
  for (const c of cute) expect(c.length).toBeGreaterThan(300)
  // 전통: 소원마다 상징 획(data-part=symbol)이 다르다
  const sym = WISHES.map((wish) => [...dom(spec({ wish }), null).querySelectorAll('[data-part=symbol] path')].map((e) => e.getAttribute('d')).join('|'))
  expect(new Set(sym).size).toBe(WISHES.length)
  for (const s of sym) expect(s.length).toBeGreaterThan(300)
})

test('전통: 勅令·소원 한자·急急如律令이 나오고 같은 spec은 같은 그림이다', () => {
  for (const wish of WISHES) {
    const d = dom(spec({ wish }), null)
    expect(d.textContent).toContain('勅令')
    expect(d.textContent).toContain(WISH_TEXT[wish].hanja)
    expect(d.querySelector('[data-part=charm]')!.textContent).toBe('急急如律令')
    expect(html(spec({ wish }))).toBe(html(spec({ wish })))
  }
})

test('전통: 11소원 × 3마감 × 4변형이 던지지 않고 붉은 종이 바탕이 없다', () => {
  for (const wish of WISHES) for (const finish of FINISHES) for (let variant = 0; variant < VARIANTS; variant++) {
    const d = dom(spec({ wish, finish, variant, el: 'fire' }), '민지')
    const fills = [...d.querySelectorAll('rect')].filter((r) => !r.closest('defs')).filter((r) => r.getAttribute('width') === '240').map((r) => r.getAttribute('fill') ?? '')
    for (const f of fills.filter((x) => /^#[0-9a-f]{6}$/i.test(x))) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(f.slice(i, i + 2), 16))
      expect(r > g + 70 && r > b + 70, `${f} 붉은 바탕`).toBe(false)
    }
    expect(fills[0]?.toLowerCase()).toBe(finish === 'paper' ? PAL.paper.toLowerCase() : '#17140f')
  }
})

test('전통: hideSpine·hideSeal은 각 부분을 뺀다', () => {
  const r = (p: object) => {
    const d = document.createElement('div')
    d.innerHTML = renderToStaticMarkup(<BujeokSvg spec={spec()} name="민지" {...p} />)
    return d
  }
  expect(r({}).querySelector('[data-part=spine]')).not.toBeNull()
  expect(r({ hideSpine: true }).querySelector('[data-part=spine]')).toBeNull()
  expect(r({ hideSpine: true }).querySelector('[data-part=seal]')).not.toBeNull()
  const noSeal = r({ hideSeal: true })
  expect(noSeal.querySelector('[data-part=seal]')).toBeNull()
  expect(noSeal.querySelector('[data-part=stamp]')).toBeNull()
  expect(noSeal.querySelector('[data-part=spine]')).not.toBeNull()
  const cute = document.createElement('div')
  cute.innerHTML = renderToStaticMarkup(<BujeokSvg spec={spec({ style: 'cute' })} name="민지" hideSeal />)
  expect(cute.querySelector('[data-part=stamp]')).toBeNull()
})

test('전통: 획이 다르면 몸통 path가 다르고, 획이 없으면 기본 획이다', () => {
  const spineOf = (stroke?: string) => dom(spec({ stroke }), null).querySelector('[data-part=spine]')!.getAttribute('d')
  const hand = encodeStroke([[122, 256], [128, 300], [114, 350], [124, 400], [118, 436], [104, 450], [90, 436]])
  expect(spineOf(hand)).not.toBe(spineOf())
  expect(spineOf(undefined)).toBe(dom(spec(), null).querySelector('[data-part=spine]')!.getAttribute('d'))
  expect(encodeStroke(DEFAULT_SPINE)).toMatch(/^s/)
  expect(spineOf(hand)).toBe(spineOf(hand))
})

test('crop이면 카드 영역만 viewBox로 잡는다', () => {
  const t = renderToStaticMarkup(<BujeokSvg spec={spec()} name={null} crop />)
  expect(t).toContain('viewBox="30 6 240 508"')
  const c = renderToStaticMarkup(<BujeokSvg spec={spec({ style: 'cute' })} name={null} crop />)
  expect(c).toContain('viewBox="24 6 252 508"')
})

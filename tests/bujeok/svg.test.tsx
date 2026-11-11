// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import BujeokSvg from '@/components/bujeok/BujeokSvg'
import { EL_KEYS, STYLES, VARIANTS, WISHES, type BujeokSpec } from '@/lib/bujeok/keys'
import { EL_COLOR, PAL } from '@/lib/bujeok/palette'
import { WISH_TEXT } from '@/content/bujeok'

const ALL: BujeokSpec[] = STYLES.flatMap((style) =>
  WISHES.flatMap((wish) => EL_KEYS.flatMap((el) => Array.from({ length: VARIANTS }, (_, variant) => ({ style, wish, el, variant })))),
)
const html = (spec: BujeokSpec, name: string | null = '민지') => renderToStaticMarkup(<BujeokSvg spec={spec} name={name} />)
const dom = (spec: BujeokSpec, name: string | null = '민지') => {
  const d = document.createElement('div')
  d.innerHTML = html(spec, name)
  return d
}
const spec = (over: Partial<BujeokSpec> = {}): BujeokSpec => ({ style: 'trad', wish: 'money', el: 'metal', variant: 0, ...over })

test('200개 조합 모두 렌더되고 viewBox가 0 0 300 520', () => {
  expect(ALL).toHaveLength(200)
  const seen = new Set<string>()
  for (const s of ALL) {
    const h = html(s)
    expect(h).toContain('viewBox="0 0 300 520"')
    seen.add(h)
  }
  expect(seen.size).toBe(200) // 조합마다 그림이 다르다
})

test('그려지는 요소 순서: 처음은 테두리, 마지막은 도장', () => {
  for (const s of ALL) {
    const els = [...dom(s).querySelectorAll('[data-a]')]
    expect(els[0].getAttribute('data-part')).toBe('border')
    expect(els.at(-1)!.getAttribute('data-a')).toBe('stamp')
    expect(els.filter((e) => e.getAttribute('data-a') === 'stamp')).toHaveLength(1)
  }
})

test('이름이 있으면 도장에 이름 글자가 있고, 없으면 "복"', () => {
  for (const style of STYLES) {
    expect(dom(spec({ style }), '민지').querySelector('[data-part=stamp]')!.textContent).toContain('민')
    expect(dom(spec({ style }), null).querySelector('[data-part=stamp]')!.textContent).toBe('복')
  }
  // 전통 도장은 공백을 빼고 네 글자까지
  expect(dom(spec(), '김 하늘이네').querySelector('[data-part=stamp]')!.textContent).toHaveLength(4)
})

test('전통 화풍에는 소원의 한자 네 글자가 순서대로 있다', () => {
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
  expect(css).toContain(`--color-bujeok-cute-paper: ${PAL.cutePaper}`)
  expect(css).toContain(`--color-bujeok-cute-ink: ${PAL.cuteInk}`)
  for (const el of EL_KEYS) expect(css).toContain(`--color-bujeok-el-${el}: ${EL_COLOR[el]}`)
})

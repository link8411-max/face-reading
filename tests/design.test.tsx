import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Icon, ICON_NAMES, SmileFace } from '@/components/icons'

const css = readFileSync('src/app/globals.css', 'utf8')

test('한글 글꼴: 제목 Gowun Batang, 본문 Noto Sans KR', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).toContain('Gowun_Batang')
  expect(layout).toContain('Noto_Sans_KR')
  expect(layout).toContain('Silkscreen')
  expect(layout).not.toContain('Noto_Serif_KR')
  expect(layout).not.toContain('Geist')
})

const TOKENS: [string, string][] = [
  ['paper', '#FBF6F1'], ['card', '#ECE5D9'], ['card-2', '#F1EBE2'], ['line', '#E6DED2'],
  ['ink', '#2E2A27'], ['muted', '#6B6259'], ['accent', '#A4553A'], ['blush', '#E9BCA8'],
  ['navy-game', '#23263A'], ['gold-game', '#E8B547'],
]

test('뉴트럴 색 토큰', () => {
  for (const [name, hex] of TOKENS) expect(css, name).toContain(`--color-${name}: ${hex}`)
})

// WCAG 대비
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
const hex = (n: string) => TOKENS.find(([k]) => k === n)![1]

test.each([['muted', 'card'], ['ink', 'card'], ['paper', 'ink'], ['accent', 'paper'], ['muted', 'paper']])('%s on %s 대비 4.5 이상', (fg, bg) => {
  expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(4.5)
})

test.each(ICON_NAMES)('아이콘 %s는 장식용(aria-hidden)이고 선 굵기 1.6', (name) => {
  const html = renderToStaticMarkup(<Icon name={name} />)
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain('stroke-width="1.6"')
  expect(html).toContain('stroke="currentColor"')
})

test('웃는 얼굴 그림은 볼 홍조에만 blush를 쓴다', () => {
  const html = renderToStaticMarkup(<SmileFace />)
  expect(html).toContain('#E9BCA8')
  expect(html).toContain('aria-hidden="true"')
})

test('불러오지 않는 굵기(900)를 쓰지 않는다 — 가짜 굵게 방지', () => {
  const { execSync } = require('node:child_process')
  const hits = execSync("grep -rl 'font-black' src || true", { encoding: 'utf8' }).trim()
  expect(hits).toBe('')
})

test('옛 민화 팔레트 색이 src에 남아 있지 않다', () => {
  const { execSync } = require('node:child_process')
  const hits = execSync("grep -rniE '#(F5E6D3|C41E3A|E8D4C4|5C4033|FFD700|D4AF37|C8323E)' src || true", { encoding: 'utf8' }).trim()
  expect(hits).toBe('')
})

test('임시 별칭 토큰(vermilion·gold·navy·paper-2)이 없다', () => {
  const { execSync } = require('node:child_process')
  expect(css).not.toMatch(/--color-(vermilion|gold|navy|paper-2):/)
  const files: string[] = execSync("grep -rlE 'vermilion|gold|navy|paper-2' src || true", { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const { readFileSync: read } = require('node:fs')
  const re = /\b(?:text|bg|border|from|to|via|ring|outline)-(?:vermilion|gold|navy|paper-2)(?![-\w])/
  expect(files.filter((f) => re.test(read(f, 'utf8')))).toEqual([])
})

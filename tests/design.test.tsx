import { koLayoutSource } from './helpers/koLayoutSource'
import { existsSync, readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { Icon, ICON_NAMES, SmileFace } from '@/components/icons'

const css = readFileSync('src/app/globals.css', 'utf8')

test('글꼴: 본문·제목 Pretendard 가변 글꼴, 부적용 Gowun Batang — 자체 호스팅(next/font/local)', () => {
  const layout = koLayoutSource()
  expect(layout).toContain('next/font/local')
  expect(layout).not.toContain('next/font/google')
  expect(layout).toContain('PretendardVariable.woff2')
  expect(layout).toContain('GowunBatang-Regular.woff2') // 전통 부적 글씨
  expect(layout).toContain('Silkscreen-Regular.woff2')
  expect(layout).not.toContain('NotoSansKR')
  expect(layout).not.toContain('Geist')
})

test('자체 호스팅 글꼴 파일과 OFL 라이선스가 src/fonts에 있다', () => {
  for (const f of ['PretendardVariable', 'GowunBatang-Regular', 'GowunBatang-Bold', 'Silkscreen-Regular']) {
    expect(existsSync(`src/fonts/${f}.woff2`), f).toBe(true)
  }
  for (const f of ['OFL-Pretendard', 'OFL-GowunBatang', 'OFL-Silkscreen']) expect(existsSync(`src/fonts/${f}.txt`), f).toBe(true)
  expect(existsSync('src/fonts/NotoSansKR-Regular.woff2')).toBe(false)
})

test('본문·제목 글꼴 변수는 둘 다 Pretendard', () => {
  expect(css).toMatch(/--font-sans:\s*var\(--font-pretendard\)/)
  expect(css).toMatch(/--font-serif:\s*var\(--font-pretendard\)/)
})

const TOKENS: [string, string][] = [
  ['paper', '#F7F8FC'], ['card', '#FFFFFF'], ['card-2', '#EEF1FA'], ['line', '#E1E6F5'],
  ['ink', '#1A1B25'], ['muted', '#5E6070'], ['accent', '#2D55FF'], ['lime', '#C6F24E'], ['blush', '#E9BCA8'],
  ['navy-game', '#23263A'], ['gold-game', '#E8B547'],
  ['bujeok-paper', '#E6C35C'], ['bujeok-jusa', '#B3261E'], ['bujeok-cute-paper', '#FFFAF2'], ['bujeok-cute-ink', '#5B4037'],
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

test.each([['muted', 'card'], ['ink', 'card'], ['paper', 'ink'], ['accent', 'paper'], ['muted', 'paper'], ['accent', 'card-2'], ['muted', 'card-2']])('%s on %s 대비 4.5 이상', (fg, bg) => {
  expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(4.5)
})

test('주 버튼 흰 글씨가 포인트색 위에서 대비 4.5 이상', () => {
  expect(contrast('#FFFFFF', hex('accent'))).toBeGreaterThanOrEqual(4.5)
})

test('옛 베이지·테라코타 색이 src에 남아 있지 않다(부적·게임 전용 색 제외)', () => {
  const { execSync } = require('node:child_process')
  // 일기토 게임 팔레트(src/game)는 화면 개편 범위 밖이라 뺀다(palette.ts·config.ts가 #6B6259를 쓴다)
  const hits = execSync("grep -rniE '#(FBF6F1|ECE5D9|F1EBE2|E6DED2|2E2A27|6B6259|9A4F35|A4553A|D6C8B4|E2D8CA|4F5A43|CFD6C4|B8AE9F)|rgba\\(46,42,39' src --exclude-dir=game || true", { encoding: 'utf8' }).trim()
  expect(hits).toBe('')
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

test('포인트색 작은 글씨가 카드 위에서도 대비 4.5 이상 (리뷰)', () => {
  expect(contrast(hex('accent'), hex('card'))).toBeGreaterThanOrEqual(4.5)
  expect(contrast(hex('accent'), hex('card-2'))).toBeGreaterThanOrEqual(4.5)
})

test('먹빛 부적 화면의 주 버튼은 금색 규칙(.bj-dark .bg-ink.text-paper)을 쓴다 — bg-accent는 먹빛에서 연살구라 흰 글씨가 안 보인다', () => {
  const { execSync } = require('node:child_process')
  const hits = execSync("grep -rln 'bg-accent text-white' src/components/bujeok src/app/\\(ko\\)/bujeok || true", { encoding: 'utf8' }).trim()
  expect(hits).toBe('')
  expect(css).toMatch(/\.bj-dark \.bg-ink\.text-paper \{/)
})

test('흰 카드 안쪽 칸은 bg-paper 대신 bg-card-2 (저장 이미지에서 칸이 사라지지 않게)', () => {
  for (const f of ['src/components/result/ResultCard.tsx', 'src/components/mbti/MbtiDailyCard.tsx', 'src/components/faceMatch/FaceMatchCard.tsx']) {
    expect(readFileSync(f, 'utf8'), f).not.toMatch(/\bbg-paper\b/)
  }
})

test('정적 페이지에 loading.tsx를 두지 않는다 — 서버 HTML의 본문이 숨김 상태(hidden)로 나가 네이버 봇이 못 읽을 수 있다', () => {
  const { execSync } = require('node:child_process')
  expect(execSync("find src/app -name loading.tsx", { encoding: 'utf8' }).trim()).toBe('')
})

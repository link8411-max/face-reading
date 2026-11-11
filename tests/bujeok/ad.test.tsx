// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import BujeokAd from '@/components/bujeok/BujeokAd'
import GiftLanding from '@/components/bujeok/GiftLanding'
import BujeokClient from '@/components/bujeok/BujeokClient'
import { HOUSE_BANNER_URL, type WeeklyHigh } from '@/lib/zipsise/banner'
import { BANNED_PHRASES } from '@/lib/bujeok/bannedPhrases'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const high: WeeklyHigh = { aptName: '인덕원 센트럴 자이 2단지', regionName: '경기 의왕', amountText: '15억 9,500만', jumpText: '+1억 500만', dealDate: '2026-11-09' }
const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 0, finish: 'gold' }

beforeEach(() => {
  track.mockClear()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const coupang = () => document.querySelector('iframe[title="쿠팡 추천 상품"]') as HTMLIFrameElement | null

test('재물 + high 있음 → 집시세 배너. 링크는 HOUSE_BANNER_URL, 새 창, nofollow·noopener', () => {
  render(<BujeokAd wish="money" high={high} />)
  const a = screen.getByRole('link', { name: /다른 신고가 보기/ })
  expect(a.getAttribute('href')).toBe(HOUSE_BANNER_URL)
  expect(a.getAttribute('target')).toBe('_blank')
  expect(a.getAttribute('rel')).toContain('nofollow')
  expect(a.getAttribute('rel')).toContain('noopener')
  expect(coupang()).toBeNull()
  const text = document.body.textContent!
  expect(text).toContain('이번 주 신고가')
  expect(text).toContain('경기 의왕 인덕원 센트럴 자이 2단지 15억 9,500만')
  expect(text).toContain('이전 최고가보다 +1억 500만')
  expect(text).not.toMatch(/㎡|평/) // 면적은 넣지 않는다
})

test('HOUSE_BANNER_URL은 집시세 신고가 페이지에 utm을 단 주소다', () => {
  expect(HOUSE_BANNER_URL).toBe('https://zipsise.com/highs?utm_source=unse&utm_medium=banner&utm_campaign=bujeok')
})

test('재물 + high 없음 → 쿠팡 배너(subId bujeok-money)', () => {
  render(<BujeokAd wish="money" high={null} />)
  expect(screen.queryByRole('link', { name: /신고가/ })).toBeNull()
  expect(coupang()!.src).toContain('subId=bujeok-money')
})

test('합격 + high 있음 → 쿠팡 배너(subId bujeok-pass)', () => {
  render(<BujeokAd wish="pass" high={high} />)
  expect(screen.queryByText('이번 주 신고가')).toBeNull()
  expect(coupang()!.src).toContain('subId=bujeok-pass')
})

test('배너 요소에 no-screenshot 클래스가 있다', () => {
  const { container, rerender } = render(<BujeokAd wish="money" high={high} />)
  expect(container.querySelector('.no-screenshot')).not.toBeNull()
  rerender(<BujeokAd wish="love" high={high} />)
  expect(container.querySelector('.no-screenshot')).not.toBeNull()
})

test('배너를 누르면 house_banner_click(slot bujeok), 이름·금액 같은 값은 보내지 않는다', () => {
  render(<BujeokAd wish="money" high={high} />)
  fireEvent.click(screen.getByRole('link', { name: /다른 신고가 보기/ }))
  expect(track).toHaveBeenCalledWith('house_banner_click', { slot: 'bujeok' })
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/인덕원|15억/)
})

test('배너가 화면에 보이면 house_banner_view를 한 번만 보낸다', () => {
  let cb: (e: { isIntersecting: boolean }[]) => void = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal('IntersectionObserver', class { constructor(c: typeof cb) { cb = c } observe() {} disconnect() { disconnect() } })
  render(<BujeokAd wish="money" high={high} />)
  expect(track).not.toHaveBeenCalled()
  cb([{ isIntersecting: true }])
  cb([{ isIntersecting: true }])
  expect(track.mock.calls.filter((c) => c[0] === 'house_banner_view')).toEqual([['house_banner_view', { slot: 'bujeok' }]])
  vi.unstubAllGlobals()
})

test('배너 문구에 금지 표현이 없다', () => {
  render(<BujeokAd wish="money" high={high} />)
  for (const w of BANNED_PHRASES) expect(document.body.textContent).not.toContain(w)
})

test('착지: 열기 전에는 광고가 없고, 연 뒤 카드 아래(버튼 위)에 있다', () => {
  render(<GiftLanding spec={spec} to="민지" from={null} ad={<BujeokAd wish="money" high={high} />} />)
  expect(screen.queryByText('이번 주 신고가')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '열어 보기' }))
  const card = screen.getByTestId('bujeok-card')
  const ad = screen.getByText('이번 주 신고가')
  expect(card.compareDocumentPosition(ad) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  // 카드 안·위에는 없다
  expect(card.contains(ad)).toBe(false)
})

test('완성 화면: 광고는 카드 아래에 있다. 폼 단계에는 없다', async () => {
  render(<BujeokClient high={high} />)
  expect(screen.queryByText('이번 주 신고가')).toBeNull()
  fireEvent.click(screen.getByRole('radio', { name: '재물' }))
  fireEvent.click(screen.getByRole('radio', { name: '전통' }))
  fireEvent.click(screen.getByRole('button', { name: '부적 만들기' }))
  const card = await screen.findByTestId('bujeok-card')
  const ad = screen.getByText('이번 주 신고가')
  expect(card.compareDocumentPosition(ad) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(card.contains(ad)).toBe(false)
})

test('완성 화면: 소원이 합격이면 high가 있어도 쿠팡 배너', async () => {
  render(<BujeokClient high={high} />)
  fireEvent.click(screen.getByRole('radio', { name: '합격' }))
  fireEvent.click(screen.getByRole('radio', { name: '전통' }))
  fireEvent.click(screen.getByRole('button', { name: '부적 만들기' }))
  await screen.findByTestId('bujeok-card')
  expect(screen.queryByText('이번 주 신고가')).toBeNull()
  expect(coupang()!.src).toContain('subId=bujeok-pass')
})

// 서버 전용 모듈 경계 (tests/videos/boundaries.test.ts와 같은 방식)
const SRC = join(__dirname, '..', '..', 'src')
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [] })
const files = walk(SRC).map((p) => ({ p, src: readFileSync(p, 'utf8') }))
const isClient = (src: string) => /^(['"])use client\1/.test(src.replace(/^(\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, ''))

test('클라이언트 파일은 highs.ts(서버 전용)와 ZIPSISE_DATA_URL을 가져오지 않고, 환경변수는 highs.ts에서만 읽는다', () => {
  const runtime = (s: string) => s.replace(/^import type [^\n]*$/gm, '')
  const bad = files.filter((f) => isClient(f.src)).filter((f) => runtime(f.src).includes('zipsise/highs') || f.src.includes('ZIPSISE_DATA_URL'))
  expect(bad.map((f) => f.p)).toEqual([])
  expect(files.filter((f) => f.src.includes('ZIPSISE_DATA_URL')).map((f) => f.p.slice(SRC.length + 1))).toEqual(['lib/zipsise/highs.ts'])
})

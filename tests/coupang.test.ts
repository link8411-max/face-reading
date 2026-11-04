import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import CoupangBanner, { COUPANG_WIDGET_ID } from '@/components/CoupangBanner'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p] })
}

test('예전 고정 상품 배너(950676)를 더 쓰지 않는다', () => {
  for (const f of walk('src')) expect(readFileSync(f, 'utf8'), f).not.toContain('950676')
})

test('고객 관심 기반 추천 배너 + 페이지별 subId + 수수료 고지', () => {
  expect(COUPANG_WIDGET_ID).toBe(1043563)
  const html = renderToStaticMarkup(createElement(CoupangBanner, { subId: 'samguk' }))
  expect(html).toContain('id=1043563')
  expect(html).toContain('subId=samguk')
  expect(html).toContain('trackingCode=AF6497036')
  expect(html).toContain('쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다')
})

test.each([
  ['src/app/page.tsx', 'home'], ['src/app/face2/page.tsx', 'face'], ['src/app/animal/page.tsx', 'animal'],
  ['src/app/samguk/(match)/page.tsx', 'samguk'], ['src/app/fortune/FortuneClient.tsx', 'fortune'], ['src/app/fortune/daily/page.tsx', 'daily'],
  ['src/app/samguk/cup/page.tsx', 'cup-hub'],
  ['src/app/mbti/page.tsx', 'mbti-hub'], ['src/components/mbti/MbtiDailyClient.tsx', 'mbti-daily'],
  ['src/app/fortune/2027/page.tsx', 'fortune-2027'], ['src/app/face-tests/page.tsx', 'face-tests'], ['src/app/unse/page.tsx', 'unse'],
  ['src/app/samguk/cup/ranking/page.tsx', 'cup-ranking'], ['src/app/mbti/r/[pair]/page.tsx', 'share-mbti'],
  ['src/app/samguk/cup/r/[board]/[id]/page.tsx', 'share-cup'], ['src/app/samguk/duel/r/[key]/page.tsx', 'share-duel'],
  ['src/app/face-match/r/[pair]/page.tsx', 'share-face-match'], ['src/app/fortune/mbti/r/[type]/page.tsx', 'share-mbti-daily'], ['src/app/samguk/(match)/team/r/[ids]/page.tsx', 'share-team'],
])('%s 에 배너가 있다', (file, subId) => {
  expect(readFileSync(file, 'utf8')).toContain(`<CoupangBanner subId="${subId}"`)
})

test.each([
  ['src/app/samguk/duel/generals/[id]/page.tsx', 'subId={`duel-${id}`}'],
  ['src/components/share/SharePage.tsx', 'subId={`share-${kind}`}'],
])('%s 에 배너가 있다 (%s)', (file, text) => {
  expect(readFileSync(file, 'utf8')).toContain(text)
})

import { gaSlot } from '@/components/CoupangBanner'
test('GA 위치 값: subId의 하이픈을 밑줄로 (GA 개인정보 필터 통과)', () => {
  expect(gaSlot('mbti-infp')).toBe('mbti_infp')
  expect(gaSlot('face-match')).toBe('face_match')
  expect(gaSlot('home')).toBe('home')
  expect(gaSlot('cup-strategist')).toBe('cup_strategist')
  expect(gaSlot('share-mbti-daily')).toBe('share_mbti_daily')
})

import { isDisplayedMessage, coupangHomeUrl, fallbackLinks, FALLBACK_DELAY_MS } from '@/components/CoupangBanner'
test('노출 메시지 판별: adOnePixelDisplayed / adDisplayed만 true (문자열 JSON·객체 모두)', () => {
  expect(isDisplayedMessage('{"type":"adDisplayed","id":"1043563"}')).toBe(true)
  expect(isDisplayedMessage({ type: 'adOnePixelDisplayed', id: '1043563' })).toBe(true)
  expect(isDisplayedMessage('{"type":"adLoaded","id":"1043563","hasAd":true}')).toBe(false)
  expect(isDisplayedMessage({ type: 'adLoaded', id: '1043563', hasAd: true })).toBe(false)
  expect(isDisplayedMessage('garbage')).toBe(false)
  expect(isDisplayedMessage(null)).toBe(false)
  expect(isDisplayedMessage(42)).toBe(false)
})

test('대체 링크 대기 시간은 4초', () => {
  expect(FALLBACK_DELAY_MS).toBe(5000)
})

test('쿠팡 홈 링크: 파트너스 추적 코드와 subid', () => {
  const url = coupangHomeUrl('samguk')
  expect(url.startsWith('https://link.coupang.com/re/AFFHOMEWW')).toBe(true)
  expect(url).toContain('lptag=AF6497036')
  expect(url).toContain('subid=samguk')
})

test('대체 링크: 시즌 중엔 시즌 링크 뒤에 홈, 시즌 밖엔 홈만', () => {
  expect(fallbackLinks('face', new Date('2026-11-03T03:00:00Z')).map((l) => l.key)).toEqual(['gift', 'chapssal', 'yeot', 'snack', 'home'])
  expect(fallbackLinks('face', new Date('2026-12-15T03:00:00Z')).map((l) => l.key)).toEqual(['home'])
})

test.each(['src/app/samguk/(match)/page.tsx', 'src/app/face2/page.tsx', 'src/app/animal/page.tsx'])(
  '%s: 배너는 공유·저장 버튼 바로 아래, 다음 테스트 위',
  (file) => {
    const src = readFileSync(file, 'utf8')
    const actions = src.indexOf('<ResultActions')
    const banner = src.indexOf('<CoupangBanner')
    const next = src.indexOf('<NextTests')
    expect(actions).toBeGreaterThan(-1)
    expect(actions).toBeLessThan(banner)
    expect(banner).toBeLessThan(next)
  },
)

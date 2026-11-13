import { TABS, ALL_ITEMS, CATEGORIES, FOOTER_EXTRA, tabForPath } from '@/content/navigation'
import { SITEMAP_ROUTES } from '@/app/sitemap'

test('하단 탭은 홈·전체·오늘 셋', () => {
  expect(TABS.map((t) => t.href)).toEqual(['/', '/all', '/today'])
  expect(TABS.map((t) => t.label)).toEqual(['홈', '전체', '오늘'])
})
test('경로별 현재 탭', () => {
  expect(tabForPath('/')).toBe('home'); expect(tabForPath('/today')).toBe('today')
  expect(tabForPath('/face2')).toBe('all'); expect(tabForPath('/bujeok/r/x')).toBe('all')
  expect(tabForPath('/fortune/mbti')).toBe('all'); expect(tabForPath('/mbti')).toBe('all')
})
test('모든 항목에 태그가 있고 주소가 겹치지 않는다', () => {
  for (const i of ALL_ITEMS) expect(i.tags.length, i.href).toBeGreaterThan(0)
  expect(new Set(ALL_ITEMS.map((i) => i.href)).size).toBe(ALL_ITEMS.length)
})
test('매일 바뀌는 항목은 셋', () => { expect(ALL_ITEMS.filter((i) => i.daily).map((i) => i.href).sort()).toEqual(['/exam/meme', '/fortune/daily', '/fortune/mbti']) })
test('사진이 없는 항목은 캐릭터 얼굴 썸네일', () => {
  const item = (h: string) => ALL_ITEMS.find((i) => i.href === h)!
  expect(item('/face2').thumb.image).toBe('/images/cast/haetae-face.webp')
  expect(item('/bujeok').thumb.image).toBe('/images/cast/mudang-face.webp')
  expect(item('/samguk').thumb.image).toContain('/images/samguk/')
})

test('메뉴 데이터에 이모지가 없다 (선 아이콘으로 대체)', () => {
  const { readFileSync } = require('node:fs')
  expect(readFileSync('src/content/navigation.ts', 'utf8')).not.toMatch(/\p{Extended_Pictographic}/u)
  for (const c of CATEGORIES) for (const i of c.items) expect(i.thumb.image || i.thumb.icon, i.href).toBeTruthy()
})

test('묶음 항목의 주소는 모두 실제 페이지다', () => {
  const routes = new Set<string>([...(SITEMAP_ROUTES as readonly string[]), '/mbti'])
  for (const c of CATEGORIES) for (const item of c.items) expect(routes.has(item.href), item.href).toBe(true)
})

test('얼굴·운세 묶음에 기존 테스트 6개가 모두 들어 있다', () => {
  const hrefs = CATEGORIES.flatMap((c) => c.items.map((i) => i.href))
  for (const h of ['/face2', '/animal', '/samguk', '/fortune', '/fortune/2027', '/fortune/daily']) expect(hrefs).toContain(h)
})

test('8단계 메뉴: 궁합 묶음에 얼굴 궁합, 얼굴 묶음에 우리 팀 삼국지', () => {
  const hrefs = (k: string) => CATEGORIES.find((c) => c.key === k)!.items.map((i) => i.href)
  expect(hrefs('mbti')).toContain('/face-match')
  expect(hrefs('face')).toContain('/samguk/team')
})

test('밈 능력고사는 푸터에만 항목이 있다: 묶음(홈 탭·허브)은 그대로, 하단 탭은 셋', () => {
  expect(FOOTER_EXTRA.map((i) => [i.title, i.href])).toEqual([['밈 능력고사', '/exam/meme']])
  expect(CATEGORIES.flatMap((c) => c.items.map((i) => i.href))).not.toContain('/exam/meme')
  expect(TABS).toHaveLength(3)
  expect((SITEMAP_ROUTES as readonly string[]).includes('/exam/meme')).toBe(true)
  const { readFileSync } = require('node:fs')
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout.match(/FOOTER_EXTRA\.map/g)).toHaveLength(1)
})

test('부적(/bujeok)은 사주·운세 묶음에 있다', () => {
  const unse = CATEGORIES.find((c) => c.key === 'unse')!
  expect(unse.items.map((i) => i.href)).toContain('/bujeok')
  expect(SITEMAP_ROUTES as readonly string[]).toContain('/bujeok')
})

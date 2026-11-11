import { TABS, CATEGORIES, FOOTER_EXTRA, tabForPath } from '@/content/navigation'
import { SITEMAP_ROUTES } from '@/app/sitemap'

test('탭 5개: 홈·관상·사주·운세·부적·궁합', () => {
  expect(TABS.map((t) => [t.label, t.href])).toEqual([['홈', '/'], ['관상', '/face-tests'], ['사주·운세', '/unse'], ['부적', '/bujeok'], ['궁합', '/mbti']])
})

test('메뉴 데이터에 이모지가 없다 (선 아이콘으로 대체)', () => {
  const { readFileSync } = require('node:fs')
  expect(readFileSync('src/content/navigation.ts', 'utf8')).not.toMatch(/\p{Extended_Pictographic}/u)
  for (const c of CATEGORIES) for (const i of c.items) expect(i.thumb.image || i.thumb.icon, i.href).toBeTruthy()
})

test.each([
  ['/', 'home'], ['/about', 'home'], ['/privacy', 'home'],
  ['/face2', 'face'], ['/animal', 'face'], ['/samguk', 'face'], ['/face-tests', 'face'],
  ['/fortune', 'unse'], ['/bujeok', 'bujeok'], ['/bujeok/r/trad-money-metal-0-gold', 'bujeok'], ['/bujeok/box', 'bujeok'], ['/fortune/daily', 'unse'], ['/fortune/2027', 'unse'], ['/fortune/2027/sheep', 'unse'], ['/unse', 'unse'],
  ['/mbti', 'mbti'], ['/face-match', 'mbti'], ['/face-match/r/cat-fox', 'mbti'], ['/samguk/team', 'face'],
])('tabForPath(%s) = %s', (path, key) => {
  expect(tabForPath(path)).toBe(key)
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

test('밈 능력고사는 푸터에만 항목이 있다: 묶음(홈 탭·허브)은 그대로, 하단 탭은 다섯', () => {
  expect(FOOTER_EXTRA.map((i) => [i.title, i.href])).toEqual([['밈 능력고사', '/exam/meme']])
  expect(CATEGORIES.flatMap((c) => c.items.map((i) => i.href))).not.toContain('/exam/meme')
  expect(TABS).toHaveLength(5)
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

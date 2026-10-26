import { TABS, CATEGORIES, tabForPath } from '@/content/navigation'
import { SITEMAP_ROUTES } from '@/app/sitemap'

test('탭 4개: 홈·얼굴·운세·궁합 (주소는 그대로)', () => {
  expect(TABS.map((t) => [t.label, t.href])).toEqual([['홈', '/'], ['얼굴', '/face-tests'], ['운세', '/unse'], ['궁합', '/mbti']])
})

test('메뉴 데이터에 이모지가 없다 (선 아이콘으로 대체)', () => {
  const { readFileSync } = require('node:fs')
  expect(readFileSync('src/content/navigation.ts', 'utf8')).not.toMatch(/\p{Extended_Pictographic}/u)
  for (const c of CATEGORIES) for (const i of c.items) expect(i.thumb.image || i.thumb.icon, i.href).toBeTruthy()
})

test.each([
  ['/', 'home'], ['/about', 'home'], ['/privacy', 'home'],
  ['/face2', 'face'], ['/animal', 'face'], ['/samguk', 'face'], ['/face-tests', 'face'],
  ['/fortune', 'unse'], ['/fortune/daily', 'unse'], ['/fortune/2027', 'unse'], ['/fortune/2027/sheep', 'unse'], ['/unse', 'unse'],
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

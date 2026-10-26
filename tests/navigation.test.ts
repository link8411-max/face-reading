import { TABS, CATEGORIES, tabForPath } from '@/content/navigation'
import { SITEMAP_ROUTES } from '@/app/sitemap'

test('탭 4개: 홈·얼굴·운세·MBTI', () => {
  expect(TABS.map((t) => [t.label, t.href])).toEqual([['홈', '/'], ['얼굴', '/face-tests'], ['운세', '/unse'], ['MBTI', '/mbti']])
})

test.each([
  ['/', 'home'], ['/about', 'home'], ['/privacy', 'home'],
  ['/face2', 'face'], ['/animal', 'face'], ['/samguk', 'face'], ['/face-tests', 'face'],
  ['/fortune', 'unse'], ['/fortune/daily', 'unse'], ['/fortune/2027', 'unse'], ['/fortune/2027/sheep', 'unse'], ['/unse', 'unse'],
  ['/mbti', 'mbti'],
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

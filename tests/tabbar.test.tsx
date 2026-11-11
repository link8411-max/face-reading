import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('next/navigation', () => ({ usePathname: () => '/fortune/daily' }))
import BottomTabBar from '@/components/BottomTabBar'
import CategoryList from '@/components/CategoryList'
import { CATEGORIES, tabForPath } from '@/content/navigation'

test('하단 탭바: 이모지 없이 선 아이콘, 현재 탭은 aria-current', () => {
  const html = renderToStaticMarkup(<BottomTabBar />)
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
  expect(html).toContain('stroke-width="1.6"')
  expect(html).toMatch(/aria-current="page"[^>]*>[\s\S]*?운세/)
  expect(html).toContain('궁합')
  expect(html).toContain('href="/bujeok"')
  expect(html).toContain('grid-cols-5')
  expect(html.match(/<li>/g)).toHaveLength(5)
})

test('묶음 목록 썸네일도 이모지 없이 아이콘', () => {
  const html = renderToStaticMarkup(<CategoryList items={CATEGORIES.flatMap((c) => c.items)} />)
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
})

test('부적 탭: /bujeok 아래 모든 경로에서 현재 탭', () => {
  vi.resetModules()
  for (const p of ['/bujeok', '/bujeok/r/trad-money-metal-0-gold', '/bujeok/box']) expect(tabForPath(p)).toBe('bujeok')
})

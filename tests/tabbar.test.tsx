import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('next/navigation', () => ({ usePathname: () => '/fortune/daily' }))
import BottomTabBar from '@/components/BottomTabBar'
import CategoryList from '@/components/CategoryList'
import { CATEGORIES, tabForPath } from '@/content/navigation'

test('하단 탭바: 이모지 없이 선 아이콘, 현재 탭은 aria-current', () => {
  const html = renderToStaticMarkup(<BottomTabBar />)
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
  expect(html).toContain('stroke-width="1.6"')
  expect(html).toContain('grid-cols-3')
  expect(html).toContain('href="/all"')
  expect(html).toContain('href="/today"')
  expect(html.match(/<li>/g)).toHaveLength(3)
})

test('묶음 목록 썸네일도 이모지 없이 아이콘', () => {
  const html = renderToStaticMarkup(<CategoryList items={CATEGORIES.flatMap((c) => c.items)} />)
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
})

test('경로에 맞는 탭이 현재 탭: 전체 아래 부적도 전체', () => {
  for (const p of ['/bujeok', '/bujeok/r/trad-money-metal-0-gold', '/bujeok/box', '/face2']) expect(tabForPath(p)).toBe('all')
})

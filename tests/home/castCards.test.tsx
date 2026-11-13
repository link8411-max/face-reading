import { renderToStaticMarkup } from 'react-dom/server'
import HomeGrid, { HOME_DEFAULT } from '@/components/home/HomeGrid'
import { ALL_ITEMS } from '@/content/navigation'

const html = renderToStaticMarkup(<HomeGrid items={ALL_ITEMS}><span /></HomeGrid>)
const cards = html.split('data-home-card=').slice(1)

test('처음에 보이는 홈 카드(전체 칩)에서 같은 캐릭터 그림이 두 번 나오지 않는다', () => {
  const shown = cards.filter((c) => HOME_DEFAULT.some((h) => c.startsWith(`"${h}"`)))
  expect(shown).toHaveLength(HOME_DEFAULT.length)
  const srcs = shown.map((c) => c.match(/src="(\/images\/cast\/[^"]+)"/)?.[1]).filter(Boolean)
  expect(srcs.length).toBeGreaterThanOrEqual(7)
  expect(new Set(srcs).size).toBe(srcs.length)
})

test('오늘의 운세 카드는 저승사자 막내 그림이다', () => {
  const daily = cards.find((c) => c.startsWith('"/fortune/daily"')) ?? ''
  expect(daily).toContain('/images/cast/sajaF.webp')
  expect(daily).toContain('저승사자 막내 캐릭터')
})

test('어느 칩에서든 보이는 카드끼리 같은 그림이 두 번 나오지 않는다(MBTI 카드는 MBTI 유형 그림)', async () => {
  const { ALL_ITEMS: items } = await import('@/content/navigation')
  const { visibleFor } = await import('@/components/home/HomeGrid')
  const { existsSync } = await import('node:fs')
  const srcOf = (href: string) => cards.find((c) => c.startsWith(`"${href}"`))?.match(/src="(\/images\/(?:cast|mbti)\/[^"]+)"/)?.[1]
  for (const chip of ['face', 'fortune', 'match', 'play'] as const) {
    const srcs = items.filter((i) => visibleFor(chip, i)).map((i) => srcOf(i.href)).filter(Boolean) as string[]
    expect(new Set(srcs).size, chip).toBe(srcs.length)
    for (const s of srcs) expect(existsSync(`public${s}`), s).toBe(true)
  }
  expect(srcOf('/mbti')).toBe('/images/mbti/isfj.webp')
})

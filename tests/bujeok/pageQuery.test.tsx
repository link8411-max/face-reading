import { expect, test, vi } from 'vitest'

vi.mock('@/lib/zipsise/highs', () => ({ fetchWeeklyHigh: async () => null }))
vi.mock('@/components/PageGuide', () => ({ default: () => null }))
vi.mock('@/components/bujeok/BujeokClient', () => ({ default: () => null }))

import BujeokPage from '@/app/bujeok/page'
import BujeokClient from '@/components/bujeok/BujeokClient'

type El = { type: unknown; props: { initial?: unknown; children?: unknown } }
function findClient(node: unknown): El | null {
  if (!node || typeof node !== 'object') return null
  const el = node as El
  if (el.type === BujeokClient) return el
  const ch = el.props?.children
  for (const c of Array.isArray(ch) ? ch : [ch]) {
    const f = findClient(c)
    if (f) return f
  }
  return null
}

test('/bujeok?mode=gift&wish=pass 는 initial에 gift·pass로 전달된다', async () => {
  const tree = await BujeokPage({ searchParams: Promise.resolve({ mode: 'gift', wish: 'pass' }) })
  expect(findClient(tree)!.props.initial).toMatchObject({ mode: 'gift', wish: 'pass' })
})

test('허용 목록 밖 값은 무시한다', async () => {
  const tree = await BujeokPage({ searchParams: Promise.resolve({ mode: 'x', wish: 'zzz' }) })
  expect(findClient(tree)!.props.initial).toMatchObject({ mode: undefined, wish: undefined })
})

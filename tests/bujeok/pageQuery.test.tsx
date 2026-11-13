import { expect, test, vi } from 'vitest'

vi.mock('@/lib/zipsise/highs', () => ({ fetchWeeklyHigh: async () => null }))
vi.mock('@/components/PageGuide', () => ({ default: () => null }))
vi.mock('@/components/bujeok/BujeokClient', () => ({ default: () => null }))

import BujeokPage from '@/app/(ko)/bujeok/page'
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

test('/bujeok?wish=samjae 는 삼재 막이를 미리 고른다 (띠별 글·2027 허브의 링크가 여는 주소)', async () => {
  const tree = await BujeokPage({ searchParams: Promise.resolve({ wish: 'samjae' }) })
  expect(findClient(tree)!.props.initial).toMatchObject({ wish: 'samjae' })
  for (const w of ['allgood', 'career', 'business', 'family', 'wish']) {
    const t = await BujeokPage({ searchParams: Promise.resolve({ wish: w }) })
    expect(findClient(t)!.props.initial).toMatchObject({ wish: w })
  }
})

test('허용 목록 밖 값은 무시한다', async () => {
  const tree = await BujeokPage({ searchParams: Promise.resolve({ mode: 'x', wish: 'zzz' }) })
  expect(findClient(tree)!.props.initial).toMatchObject({ mode: undefined, wish: undefined })
})

// ---- 삼재 막이 부적으로 잇는 링크 ----
import { renderToStaticMarkup } from 'react-dom/server'
import Zodiac2027Hub from '@/app/(ko)/fortune/2027/page'
import Zodiac2027Article from '@/components/Zodiac2027Article'
import { SAMJAE_2027, ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'

test('2027 허브의 삼재 문단에 "삼재 막이 부적 만들기" 링크가 있다', () => {
  const html = renderToStaticMarkup(<Zodiac2027Hub />)
  const start = html.indexOf('2027년 삼재띠는?')
  const sec = html.slice(start, html.indexOf('href="/face2"'))
  expect(sec).toContain('href="/bujeok?wish=samjae"')
  expect(sec).toContain('삼재 막이 부적 만들기')
})

test('띠별 글은 삼재띠(돼지·토끼·양)에만 삼재 막이 부적 링크가 있다', () => {
  for (const slug of ZODIAC_SLUGS) {
    const html = renderToStaticMarkup(<Zodiac2027Article slug={slug} />)
    if (slug in SAMJAE_2027) {
      expect(html, slug).toContain('href="/bujeok?wish=samjae"')
      expect(html, slug).toContain('삼재 막이 부적 만들기')
    } else {
      expect(html, slug).not.toContain('wish=samjae')
    }
  }
})

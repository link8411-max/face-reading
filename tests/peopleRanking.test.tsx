import { renderToStaticMarkup } from 'react-dom/server'

const rows = vi.hoisted(() => ({ value: [] as { id: string; n: number }[], fail: false }))
vi.mock('@/lib/people/store', () => ({
  storeConfig: () => ({ url: 'http://x', key: 'k' }),
  readCheerRanking: async () => {
    if (rows.fail) throw new Error('boom')
    return rows.value
  },
}))

import Ranking from '@/app/(ko)/samguk/people/ranking/page'

test('응원이 충분하면 전체·세력별 순위를 서버 HTML에 적는다', async () => {
  rows.fail = false
  rows.value = [{ id: 'caocao', n: 25 }, { id: 'guanyu', n: 25 }, { id: 'nobody', n: 50 }]
  const html = renderToStaticMarkup(await Ranking())
  expect(html).not.toContain('응원을 모으는 중')
  expect(html).toContain('전체 순위')
  expect(html).toContain('위나라 순위')
  expect(html).toContain('촉나라 순위')
  expect(html).toContain('25번 응원')
  expect(html).not.toContain('nobody')
  expect(html).toContain('href="/samguk/people/guanyu"')
})

test('저장소 오류는 페이지에 던지지 않는다', async () => {
  rows.fail = true
  expect(renderToStaticMarkup(await Ranking())).toContain('응원을 모으는 중')
})

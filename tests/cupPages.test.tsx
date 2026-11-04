import { renderToStaticMarkup } from 'react-dom/server'

const store = vi.hoisted(() => ({
  fail: false,
  summary: {
    plays: { warrior: 12, strategist: 0, women: 3, random: 7 },
    wins: {
      warrior: [{ id: 'lvbu', n: 9 }, { id: 'guanyu', n: 3 }],
      strategist: [],
      women: [{ id: 'diaochan', n: 2 }],
      random: [{ id: 'caocao', n: 5 }],
    },
    matchWins: [{ id: 'zhaoyun', n: 40 }],
  } as unknown,
}))
vi.mock('@/lib/people/store', () => ({
  storeConfig: () => ({ url: 'http://x', key: 'k' }),
  readCupSummary: async () => {
    if (store.fail) throw new Error('boom')
    return store.summary
  },
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`)
  },
}))

import CupPicker, { generateMetadata as pickerMeta } from '@/app/samguk/cup/page'
import CupRanking, { generateMetadata as rankingMeta, revalidate as rankingRevalidate } from '@/app/samguk/cup/ranking/page'
import CupSharePage, { generateMetadata as shareMeta } from '@/app/samguk/cup/r/[board]/[id]/page'
import { revalidate as pickerRevalidate } from '@/app/samguk/cup/page'

test('판 고르기·순위 메타: 제목 48자 이하, canonical, 1시간 재검증', async () => {
  const p = await pickerMeta()
  expect(p.title).toBe('삼국지 장수 월드컵 | 최강 무장·책사·여인 16강 – 운명을 읽다')
  expect(String(p.title).length).toBeLessThanOrEqual(48)
  expect(p.alternates?.canonical).toBe('https://unse-ai.com/samguk/cup')
  const r = await rankingMeta()
  expect(r.title).toBe('삼국지 장수 월드컵 순위 | 판별 우승 – 운명을 읽다')
  expect(String(r.title).length).toBeLessThanOrEqual(48)
  expect(r.alternates?.canonical).toBe('https://unse-ai.com/samguk/cup/ranking')
  expect(pickerRevalidate).toBe(3600)
  expect(rankingRevalidate).toBe(3600)
})

test('판 고르기: 판 카드 4개와 실제 판 수만 적는다', async () => {
  store.fail = false
  const html = renderToStaticMarkup(await CupPicker())
  expect(html).toContain('누가 나의 최애 장수일까요?')
  for (const b of ['warrior', 'strategist', 'women', 'random']) expect(html).toContain(`href="/samguk/cup/${b}"`)
  expect(html).toContain('지금까지 12판')
  expect(html).toContain('지금까지 3판')
  expect(html).not.toContain('지금까지 0판')
  expect(html).toContain('href="/samguk/cup/ranking"')
  expect(html).toContain('href="/samguk/people"')
  expect(html).toContain('subId=cup-hub')
  const lastBoard = html.indexOf('href="/samguk/cup/random"')
  const banner = html.indexOf('추천 상품')
  const ranking = html.indexOf('href="/samguk/cup/ranking"')
  expect(lastBoard).toBeLessThan(banner)
  expect(banner).toBeLessThan(ranking)
})

test('판 고르기: 집계를 못 읽으면 지금까지 문구가 없다', async () => {
  store.fail = true
  const html = renderToStaticMarkup(await CupPicker())
  expect(html).not.toContain('지금까지')
  expect(html).toContain('href="/samguk/cup/warrior"')
})

test('순위: 무작위 판 제외, 많이 이긴 장수 포함, 이름은 열전 링크', async () => {
  store.fail = false
  const html = renderToStaticMarkup(await CupRanking())
  expect(html).toContain('href="/samguk/people/lvbu"')
  expect(html).toContain('href="/samguk/people/zhaoyun"')
  expect(html).toContain('많이 이긴 장수')
  expect(html).not.toContain('href="/samguk/people/caocao"')
  expect(html).not.toContain('아직 우승 기록을 모으는 중이에요')
})

test('순위: 집계가 없거나 못 읽으면 모으는 중 문구와 판 고르기 링크', async () => {
  store.fail = true
  let html = renderToStaticMarkup(await CupRanking())
  expect(html).toContain('아직 우승 기록을 모으는 중이에요')
  expect(html).toContain('href="/samguk/cup"')
  store.fail = false
  store.summary = { plays: { warrior: 0, strategist: 0, women: 0, random: 0 }, wins: { warrior: [], strategist: [], women: [], random: [] }, matchWins: [] }
  html = renderToStaticMarkup(await CupRanking())
  expect(html).toContain('아직 우승 기록을 모으는 중이에요')
})

test('공유 착지: noindex, canonical은 월드컵 첫 화면, 본문에 이름·버튼', async () => {
  const params = Promise.resolve({ board: 'warrior', id: 'lvbu' })
  const m = await shareMeta({ params })
  expect(m.title).toBe('나의 최애 장수는 여포. 너는? | 운명을 읽다')
  expect(m.robots).toEqual({ index: false, follow: true })
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/samguk/cup')
  expect(JSON.stringify(m.openGraph)).toContain('/api/og/result?kind=cup&board=warrior&key=lvbu')
  const html = renderToStaticMarkup(await CupSharePage({ params }))
  expect(html).toContain('친구의 최애 장수')
  expect(html).toContain('여포')
  expect(html).toContain('최강 무장')
  expect(html).toContain('나도 해보기')
  expect(html).toContain('href="/samguk/cup/warrior"')
  expect(html).toContain('여포 열전 보기')
  expect(html).toContain('href="/samguk/people/lvbu"')
})

test('공유 착지: 잘못된 주소는 월드컵 첫 화면으로', async () => {
  await expect(CupSharePage({ params: Promise.resolve({ board: 'warrior', id: 'zhugeliang' }) })).rejects.toThrow('REDIRECT:/samguk/cup')
  await expect(CupSharePage({ params: Promise.resolve({ board: 'x', id: 'lvbu' }) })).rejects.toThrow('REDIRECT:/samguk/cup')
  expect(await shareMeta({ params: Promise.resolve({ board: 'x', id: 'lvbu' }) })).toEqual({})
})

test('미리보기 이미지 라우트: 판 후보가 아닌 인물·허용 밖 매개변수는 400', async () => {
  const { GET } = await import('@/app/api/og/result/route')
  const { NextRequest } = await import('next/server')
  const get = (qs: string) => GET(new NextRequest(`https://unse-ai.com/api/og/result?${qs}`))
  expect((await get('kind=cup&board=warrior&key=zhugeliang')).status).toBe(400)
  expect((await get('kind=cup&board=x&key=lvbu')).status).toBe(400)
  expect((await get('kind=cup&board=warrior&key=lvbu&s=90')).status).toBe(400)
})

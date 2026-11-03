import { renderToStaticMarkup } from 'react-dom/server'
import Hub, { generateMetadata as hubMeta } from '@/app/samguk/people/page'
import Ranking, { generateMetadata as rankMeta, revalidate } from '@/app/samguk/people/ranking/page'
import { rankingView } from '@/lib/people/ranking'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import { factionGroups } from '@/lib/people/relations'

test('rankingView: 합 30 미만이면 준비 중, 30 이상이면 순위(동점은 같은 순위, 열전 없는 id는 빠짐)', () => {
  expect(rankingView([{ id: 'a', n: 10 }, { id: 'b', n: 10 }]).ready).toBe(false)
  expect(rankingView([{ id: 'guanyu', n: 10 }, { id: 'caocao', n: 10 }]).ready).toBe(false)
  expect(rankingView([]).ready).toBe(false)
  const v = rankingView([{ id: 'guanyu', n: 20 }, { id: 'caocao', n: 20 }, { id: 'nobody', n: 99 }, { id: 'liubei', n: 5 }])
  expect(v.ready).toBe(true)
  expect(v.rows.map((r) => r.id)).not.toContain('nobody')
  const g = v.rows.find((r) => r.id === 'guanyu')!
  const c = v.rows.find((r) => r.id === 'caocao')!
  expect(g.rank).toBe(1)
  expect(c.rank).toBe(1)
  const low = rankingView([{ id: 'guanyu', n: 20 }, { id: 'caocao', n: 15 }])
  expect(low.rows.map((r) => [r.id, r.rank])).toEqual([['guanyu', 1], ['caocao', 2]])
  const third = rankingView([{ id: 'guanyu', n: 20 }, { id: 'caocao', n: 20 }, { id: 'zhangfei', n: 20 }].filter((r) => PEOPLE_IDS.includes(r.id)), 30)
  expect(third.rows.every((r) => r.rank === 1)).toBe(true)
})

test('허브: 세력 제목, 열전 링크, 관우·조조가 한 줄에 나오는 관계 글, 쿠팡 배너는 본문 아래', async () => {
  const html = renderToStaticMarkup(await Hub())
  const factions = factionGroups().map((g) => g.faction)
  expect(factions.length).toBeGreaterThan(0)
  for (const f of factions) expect(html).toContain(f === '기타' ? '그 밖의 세력' : `${f}나라`)
  for (const id of PEOPLE_IDS) expect(html).toContain(`href="/samguk/people/${id}"`)
  expect(html.match(/<details/g)!.length).toBeGreaterThanOrEqual(factions.length)
  expect(html.match(/<details open/g)).toHaveLength(1)
  expect(html).toContain('<h1')
  expect(html).toContain('세력을 넘는 관계')
  const lines = html.match(/<li[^>]*>.*?<\/li>/gs)!.map((l) => l.replace(/<[^>]+>/g, ''))
  expect(lines.some((l) => l.includes('관우') && l.includes('조조'))).toBe(true)
  expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('쿠팡 추천 상품'))
  expect(html.indexOf('세력을 넘는 관계')).toBeLessThan(html.indexOf('쿠팡 추천 상품'))
  expect(html).toContain('"BreadcrumbList"')
  expect(html).not.toMatch(/HOT|인기 순위|명 참여/)
})

test('허브 메타: 제목 형식, canonical', async () => {
  const m = await hubMeta()
  expect(m.title).toBe('삼국지 인물 관계도 | 위·촉·오 인물 소개 – 운명을 읽다')
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/samguk/people')
})

test('순위(env 없음): 응원을 모으는 중과 열전 링크 목록, 쿠팡 배너는 본문 아래', async () => {
  const saved = [process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY]
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_KEY
  try {
    const html = renderToStaticMarkup(await Ranking())
    expect(html).toContain('응원을 모으는 중')
    for (const id of PEOPLE_IDS) expect(html).toContain(`href="/samguk/people/${id}"`)
    expect(html.indexOf('응원을 모으는 중')).toBeLessThan(html.indexOf('쿠팡 추천 상품'))
    expect(html).toContain('"BreadcrumbList"')
  } finally {
    if (saved[0] !== undefined) process.env.SUPABASE_URL = saved[0]
    if (saved[1] !== undefined) process.env.SUPABASE_SERVICE_KEY = saved[1]
  }
})

test('순위: 저장소가 실패해도 페이지는 던지지 않고 준비 중으로 보인다', async () => {
  const saved = [process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY]
  process.env.SUPABASE_URL = 'http://127.0.0.1:1'
  process.env.SUPABASE_SERVICE_KEY = 'x'
  try {
    const html = renderToStaticMarkup(await Ranking())
    expect(html).toContain('응원을 모으는 중')
  } finally {
    for (const [i, k] of ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'].entries()) {
      if (saved[i] === undefined) delete process.env[k]
      else process.env[k] = saved[i]
    }
  }
})

test('순위 메타·재검증 1시간', async () => {
  expect(revalidate).toBe(3600)
  const m = await rankMeta()
  expect(m.title).toBe('삼국지 인물 순위 | 가장 응원받는 장수 – 운명을 읽다')
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/samguk/people/ranking')
})

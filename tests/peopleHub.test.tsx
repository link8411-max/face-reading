vi.mock('@/lib/videos/fetch', () => ({ getChannelVideos: async () => [] }))
import { renderToStaticMarkup } from 'react-dom/server'
import Hub, { generateMetadata as hubMeta } from '@/app/samguk/people/page'
import Ranking, { generateMetadata as rankMeta, revalidate } from '@/app/samguk/people/ranking/page'
import { rankingView, rankOf } from '@/lib/people/ranking'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import { factionGroups, relationsOf } from '@/lib/people/relations'
import { hubRelations } from '@/lib/people/hubRelations'
import { PENDING_PORTRAIT_IDS } from '@/lib/samgukDB'
import { readFileSync } from 'node:fs'
import { POPULAR_IDS } from '@/lib/people/hubCards'

test('rankingView: 응원이 하나라도 있으면 순위(동점은 같은 순위, 열전 없는 id는 빠짐), 없으면 준비 중', () => {
  expect(rankingView([]).ready).toBe(false)
  expect(rankingView([{ id: 'guanyu', n: 0 }]).ready).toBe(false)
  expect(rankingView([{ id: 'nobody', n: 5 }]).ready).toBe(false)
  const one = rankingView([{ id: 'guanyu', n: 1 }])
  expect(one.ready).toBe(true)
  expect(one.rows).toEqual([{ id: 'guanyu', n: 1, rank: 1 }])
  const v = rankingView([{ id: 'guanyu', n: 20 }, { id: 'caocao', n: 20 }, { id: 'nobody', n: 99 }, { id: 'liubei', n: 5 }])
  expect(v.ready).toBe(true)
  expect(v.rows.map((r) => r.id)).not.toContain('nobody')
  expect(v.rows.map((r) => [r.id, r.rank])).toEqual([['caocao', 1], ['guanyu', 1], ['liubei', 3]])
  expect(rankingView([{ id: 'guanyu', n: 20 }, { id: 'caocao', n: 15 }]).rows.map((r) => [r.id, r.rank])).toEqual([['guanyu', 1], ['caocao', 2]])
  expect(rankingView([{ id: 'guanyu', n: 2 }], 30).ready).toBe(false)
})

test('rankOf: 동점은 같은 순위, 응원 없는 인물은 null', () => {
  const rows = [{ id: 'caocao', n: 9 }, { id: 'guanyu', n: 7 }, { id: 'liubei', n: 7 }, { id: 'zhangfei', n: 0 }]
  expect(rankOf(rows, 'caocao')).toBe(1)
  expect(rankOf(rows, 'guanyu')).toBe(2)
  expect(rankOf(rows, 'liubei')).toBe(2)
  expect(rankOf(rows, 'zhangfei')).toBeNull()
  expect(rankOf(rows, 'nobody')).toBeNull()
})

test('허브: 세력 제목, 열전 링크, 관우·조조가 한 줄에 나오는 관계 글, 쿠팡 배너는 본문 아래', async () => {
  const html = renderToStaticMarkup(await Hub())
  const factions = factionGroups().map((g) => g.faction)
  expect(factions.length).toBeGreaterThan(0)
  for (const f of factions) expect(html).toContain(f === '기타' ? '그 밖의 세력' : `${f}나라`)
  for (const id of PEOPLE_IDS) expect(html).toContain(`href="/samguk/people/${id}"`)
  expect(html.match(/<details/g)!.length).toBeGreaterThanOrEqual(factions.length)
  expect(html).not.toMatch(/<details[^>]*\sopen/)
  expect(html).toContain('<h1')
  expect(html).toContain('천하를 눌러 영웅을 만나 보세요')
  expect(html).toContain('세력을 넘는 관계')
  const lines = html.match(/<li[^>]*>.*?<\/li>/gs)!.map((l) => l.replace(/<[^>]+>/g, ''))
  expect(lines.some((l) => l.includes('관우') && l.includes('조조'))).toBe(true)
  expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('쿠팡 추천 상품'))
  expect(html.indexOf('세력을 넘는 관계')).toBeLessThan(html.indexOf('쿠팡 추천 상품'))
  expect(html).toContain('"BreadcrumbList"')
  expect(html).not.toMatch(/HOT|인기 순위|명 참여/)
})

test('허브: 처음엔 펼친 details가 없고, 인물 카드 127명이 모두 서버 HTML에 있으며, 처음 보이는 건 인기 12명', async () => {
  const html = renderToStaticMarkup(await Hub())
  expect(html.match(/<details/g)!.length).toBeGreaterThan(0)
  expect(html).not.toMatch(/<details[^>]*\sopen/)
  const list = html.slice(html.indexOf('id="people-list"'), html.indexOf('aria-label="바로가기"'))
  const items = [...list.matchAll(/<li data-person="([^"]+)" class="([^"]*)"/g)]
  expect(items.map((m) => m[1]).sort()).toEqual([...PEOPLE_IDS].sort())
  expect(items.filter((m) => !m[2].includes('hidden')).map((m) => m[1])).toEqual(POPULAR_IDS)
  for (const id of PEOPLE_IDS) expect(list).toContain(`href="/samguk/people/${id}"`)
  expect(html).toContain('더 보기')
  expect(html).toContain('개략도예요. 실제 국경과 다를 수 있어요')
  for (const w of ['위나라 인물 보기', '촉나라 인물 보기', '오나라 인물 보기', '군웅 인물 보기']) expect(html).toContain(w)
  for (const c of ['낙양', '허창', '성도', '건업']) expect(html).toContain(c)
  expect(html).toContain('href="#relations"')
  expect(html).toContain('href="/samguk/people/ranking"')
  expect(html).toContain('href="/samguk/cup"')
  expect(html).toContain('장수 월드컵')
  expect(html).toContain('id="relations"')
  expect(html.indexOf('id="people-list"')).toBeLessThan(html.indexOf('id="relations"'))
  expect(html.indexOf('id="relations"')).toBeLessThan(html.indexOf('쿠팡 추천 상품'))
})

test('허브 클라이언트 컴포넌트는 열전 본문(127명 전체 데이터)을 번들에 넣지 않는다', () => {
  for (const f of ['src/components/people/PeopleBrowser.tsx', 'src/components/people/ThreeKingdomsMap.tsx', 'src/lib/people/hubFilter.ts']) {
    const src = readFileSync(f, 'utf8')
    expect(src, f).not.toMatch(/@\/content\/samgukPeople|samgukDB|lib\/people\/(hubCards|characters|relations|portrait)/)
  }
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

const noRawIds = (html: string) => {
  for (const id of PEOPLE_IDS) {
    expect(html, `raw id >${id}<`).not.toContain(`>${id}<`)
    expect(html, `raw id "${id} 초상"`).not.toContain(`alt="${id} 초상"`)
  }
}

describe('초상화 대기 인물도 이름으로 보인다', () => {
  test('허브: 모든 열전 id가 글자로 노출되지 않고, 인물마다 정확히 한 세력 묶음에 들어간다', async () => {
    const html = renderToStaticMarkup(await Hub())
    noRawIds(html)
    const groups = factionGroups()
    const all = groups.flatMap((g) => g.ids)
    expect(all.length).toBe(PEOPLE_IDS.length)
    expect(new Set(all).size).toBe(PEOPLE_IDS.length)
    expect([...all].sort()).toEqual([...PEOPLE_IDS].sort())
    for (const id of PENDING_PORTRAIT_IDS) if (PEOPLE_IDS.includes(id)) expect(all).toContain(id)
  })

  test('허브 관계 글: 줄 수가 서로 다른 관계 수와 같다(대기 인물의 관계도 빠지지 않는다)', () => {
    const { within, cross } = hubRelations()
    let expected = 0
    const seen = new Set<string>()
    for (const id of PEOPLE_IDS) {
      for (const r of relationsOf(id)) {
        if (r.otherId) {
          const key = [id, r.otherId].sort().join('|')
          if (seen.has(key)) continue
          seen.add(key)
        }
        expected++
      }
    }
    const got = Object.values(within).reduce((s, l) => s + l.length, 0) + cross.length
    expect(got).toBe(expected)
    for (const l of [...Object.values(within).flat(), ...cross]) expect(l.aName).not.toBe(l.aId)
  })

  test('순위 대체 목록: 열전 id가 글자로 노출되지 않고, 세력별 닫힌 details로 묶인다', async () => {
    const saved = [process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY]
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
    try {
      const html = renderToStaticMarkup(await Ranking())
      noRawIds(html)
      for (const id of PEOPLE_IDS) expect(html).toContain(`href="/samguk/people/${id}"`)
      expect(html.match(/<details/g)!.length).toBe(factionGroups().length)
      expect(html).not.toMatch(/<details open/)
    } finally {
      if (saved[0] !== undefined) process.env.SUPABASE_URL = saved[0]
      if (saved[1] !== undefined) process.env.SUPABASE_SERVICE_KEY = saved[1]
    }
  })
})

describe('순위 페이지: 응원이 하나라도 있으면 실제 순위', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  test('응원이 있는 인물만 순위에, 나머지는 닫힌 세력별 목록에', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([{ target: 'guanyu', n: 1 }])))
    const html = renderToStaticMarkup(await Ranking())
    expect(html).not.toContain('응원을 모으는 중')
    expect(html).toContain('전체 순위')
    expect(html).toContain('1번 응원')
    expect(html).toContain('아직 응원이 없는 인물')
    expect(html).not.toMatch(/<details open/)
    // 순위 줄(번 응원)은 관우 하나뿐이고, 나머지 인물은 목록에만 있다
    expect(html.match(/번 응원/g)).toHaveLength(2) // 전체 순위 + 촉나라 순위
    const ol = html.slice(html.indexOf('전체 순위'), html.indexOf('아직 응원이 없는 인물'))
    expect(ol).toContain('/samguk/people/guanyu')
    expect(ol).not.toContain('/samguk/people/caocao')
    const rest = html.slice(html.indexOf('아직 응원이 없는 인물'))
    expect(rest).toContain('/samguk/people/caocao')
    expect(rest).not.toContain('/samguk/people/guanyu"')
    noRawIds(html)
  })
})

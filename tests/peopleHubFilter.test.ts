import { FIRST_PAGE, matchedCount, matchesQuery, todayCard, todayIndex, visibleIds, type HubCard } from '@/lib/people/hubFilter'
import { firstSentence, hubCards, POPULAR_IDS } from '@/lib/people/hubCards'
import { PEOPLE_IDS } from '@/content/samgukPeople'

const cards = hubCards()

test('카드: 열전 인물 전부, 인기 대표가 맨 앞에 정해진 순서로', () => {
  expect(cards.map((c) => c.id).sort()).toEqual([...PEOPLE_IDS].sort())
  expect(cards.slice(0, POPULAR_IDS.length).map((c) => c.id)).toEqual(POPULAR_IDS)
  for (const c of cards) {
    expect(c.line.length, c.id).toBeGreaterThan(8)
    expect(c.name, c.id).not.toBe(c.id)
  }
})

test('첫 문장: 따옴표 안에서 끊지 않고, 따옴표 한 줄뿐이면 다음 문장을 잇는다', () => {
  expect(firstSentence('첫째예요. 둘째예요.')).toBe('첫째예요.')
  expect(firstSentence('"안녕." 다음이에요. 끝이에요.')).toBe('"안녕." 다음이에요.')
  expect(firstSentence('"우리는 모두 죽겠구나." 동탁의 모사 이유예요. 더 있어요.')).toBe('"우리는 모두 죽겠구나." 동탁의 모사 이유예요.')
  expect(firstSentence('한 줄')).toBe('한 줄')
})

test('필터: 처음엔 전체 12명, 더 보기 하면 전부, 세력을 고르면 그 세력만', () => {
  expect(visibleIds(cards, { filter: 'all', query: '', expanded: false })).toEqual(POPULAR_IDS)
  expect(visibleIds(cards, { filter: 'all', query: '', expanded: true })).toHaveLength(cards.length)
  const shu = visibleIds(cards, { filter: '촉', query: '', expanded: true })
  expect(shu).toContain('liubei')
  expect(shu).not.toContain('caocao')
  expect(visibleIds(cards, { filter: '촉', query: '', expanded: false }).length).toBe(Math.min(FIRST_PAGE, shu.length))
  expect(matchedCount(cards, { filter: '촉', query: '' })).toBe(shu.length)
})

test('검색: 이름 일부·자(字) 일부, 공백 무시, 세력 안에서만, 더 보기와 상관없이 전부', () => {
  const q = (query: string, filter: 'all' | '위' | '촉' | '오' | '기타' = 'all') => visibleIds(cards, { filter, query, expanded: false })
  expect(q('하후')).toEqual(expect.arrayContaining(['xiaohoudun', 'xiahouyuan']))
  expect(q('하후돈')).toEqual(['xiaohoudun'])
  expect(q(' 운 장 ')).toContain('guanyu') // 자 운장
  expect(q('하후', '촉')).not.toContain('xiaohoudun')
  expect(q('없는사람이름')).toEqual([])
})

test('matchesQuery: 빈 검색어는 모두 일치', () => {
  const c = { name: '관우', style: '운장' } as HubCard
  expect(matchesQuery(c, '')).toBe(true)
  expect(matchesQuery(c, '관')).toBe(true)
  expect(matchesQuery(c, '장')).toBe(true)
  expect(matchesQuery({ name: '관우', style: null } as HubCard, '운장')).toBe(false)
})

test('오늘의 인물: 같은 날짜는 같은 인물, 연속한 날은 다른 인물, n일 안에 전원이 한 번씩', () => {
  const n = cards.length
  expect(todayCard(cards, '2026-11-04')!.id).toBe(todayCard([...cards].reverse(), '2026-11-04')!.id)
  expect(todayCard(cards, '2026-11-04')!.id).toBe(todayCard(cards, '2026-11-04')!.id)
  const seen = new Set<string>()
  let prev = ''
  for (let i = 0; i < n; i++) {
    const date = new Date(Date.UTC(2026, 10, 4 + i)).toISOString().slice(0, 10)
    const id = todayCard(cards, date)!.id
    expect(id).not.toBe(prev)
    prev = id
    seen.add(id)
  }
  expect(seen.size).toBe(n)
  for (const size of [1, 2, 6, 37, 127]) expect(todayIndex('2027-01-01', size)).toBeLessThan(size)
  expect(todayCard([], '2026-11-04')).toBeNull()
})

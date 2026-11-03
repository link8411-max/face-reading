import type { PersonEntry } from '@/content/samgukPeople/types'

// 실제 열전 파일은 건드리지 않고, 서로를 가리키는 가짜 등록부로 중복 제거를 검증한다.
function fake(id: string, relations: PersonEntry['relations']): PersonEntry {
  return {
    id, style: null, styleHanja: null, born: null, died: null, birthplace: null,
    summary: '', funFacts: [], tags: [], nameMeaning: '', weapon: { novel: null, history: null },
    famousQuote: { text: '', source: '정사' }, life: '', battles: [], relations,
    novelVsHistory: [], rivalId: 'liubei', sceneOptions: [], verdictOptions: [],
  }
}

const A = fake('caocao', [
  { id: 'guanyu', type: '라이벌', note: '조조 쪽 설명', source: '정사' },
  { name: '조앙', type: '부자', note: '이름만', source: '정사' },
])
const B = fake('guanyu', [
  { id: 'caocao', type: '군신', note: '관우 쪽 설명', source: '연의' },
])

beforeEach(() => {
  vi.resetModules()
  vi.doMock('@/content/samgukPeople', () => ({
    PEOPLE: { caocao: A, guanyu: B },
    PEOPLE_IDS: ['caocao', 'guanyu'],
    getPerson: (id: string) => ({ caocao: A, guanyu: B } as Record<string, PersonEntry>)[id],
  }))
})
afterEach(() => {
  vi.doUnmock('@/content/samgukPeople')
})

test('서로를 가리키면 한 줄만 남고 내 쪽 type·note·source가 이긴다', async () => {
  const { relationsOf } = await import('@/lib/people/relations')
  const mine = relationsOf('caocao').filter((r) => r.otherId === 'guanyu')
  expect(mine).toHaveLength(1)
  expect(mine[0]).toMatchObject({ type: '라이벌', note: '조조 쪽 설명', source: '정사', hasPage: true })
  const theirs = relationsOf('guanyu').filter((r) => r.otherId === 'caocao')
  expect(theirs).toHaveLength(1)
  expect(theirs[0]).toMatchObject({ type: '군신', note: '관우 쪽 설명', source: '연의' })
})

test('이름만 있는 관계는 중복 제거와 무관하게 남는다', async () => {
  const { relationsOf } = await import('@/lib/people/relations')
  expect(relationsOf('caocao').some((r) => r.otherId === null && r.otherName === '조앙')).toBe(true)
})

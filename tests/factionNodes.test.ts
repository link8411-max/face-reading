import type { RelationView } from '@/lib/people/relations'

const graph = vi.hoisted(() => ({ rels: {} as Record<string, string[]> }))
vi.mock('@/lib/people/relations', () => ({
  relationsOf: (id: string) =>
    (graph.rels[id] ?? []).map((o) => ({ otherId: o.startsWith('x') ? null : o, otherName: o, type: '군신', note: '', source: '정사', hasPage: !o.startsWith('x'), kin: false }) as RelationView),
}))

import { pickMapNodes } from '@/lib/people/factionNodes'

test('같은 세력 안 인물과 이어진 사람을 먼저 고른다(전체 관계 수가 많아도 밖으로만 뻗으면 뒤로)', () => {
  const ids = Array.from({ length: 14 }, (_, i) => `p${i}`)
  // p0..p11은 사슬로 서로 이어짐, p12는 세력 밖·이름만 있는 관계 20개, p13은 관계 없음
  for (let i = 0; i < 12; i++) graph.rels[`p${i}`] = [`p${(i + 1) % 12}`]
  graph.rels.p12 = Array.from({ length: 20 }, (_, i) => `x${i}`)
  graph.rels.p13 = []
  const picked = pickMapNodes(ids)
  expect(picked).toHaveLength(12)
  expect(picked).not.toContain('p12')
  expect(picked).not.toContain('p13')
  expect(picked).toEqual(ids.slice(0, 12)) // 원래 순서 유지
})

test('동점이면 전체 관계 수가 많은 쪽, 최대 개수 이하면 전부', () => {
  graph.rels = { a: ['b'], b: ['a'], c: ['a', 'x1', 'x2'], d: ['b', 'x1'] }
  expect(pickMapNodes(['a', 'b', 'c', 'd'], 3)).toEqual(['a', 'c', 'd'])
  expect(pickMapNodes(['a', 'b'])).toEqual(['a', 'b'])
})

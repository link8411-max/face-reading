import { BOARD_KEYS, boardPool, bracketSize, drawEntrants, drawFromPool, isBoardKey } from '@/lib/cup/boards'
import { cupCards, meetNotes } from '@/lib/cup/cards'
import { createRng } from '@/lib/duel/rng'
import { samgukCharacters } from '@/lib/samgukDB'
import { pairKey } from '@/lib/people/keys'

const portrait = new Set(samgukCharacters.map((c) => c.id))

test('판 키', () => {
  expect(BOARD_KEYS).toEqual(['warrior', 'strategist', 'women', 'random'])
  expect(isBoardKey('warrior')).toBe(true)
  expect(isBoardKey('__proto__')).toBe(false)
})
test('최강 무장: 무력 상위 16, 2026-11-04 명단', () => {
  expect(boardPool('warrior')).toEqual(['lvbu', 'zhangfei', 'guanyu', 'machao', 'dianwei', 'zhaoyun', 'xuchu', 'pangde', 'ganning', 'taishici', 'sunce', 'zhangliao', 'yanliang', 'huangzhong', 'wenchou', 'sunjian'])
})
test('최고 책사: 지력 상위 16, 화타 제외', () => {
  const p = boardPool('strategist')
  expect(p).toHaveLength(16)
  expect(p).not.toContain('huatuo')
  expect(p.slice(0, 3)).toEqual(['zhugeliang', 'simayi', 'pangtong'])
})
test('모든 판 후보는 초상화 있는 인물', () => {
  for (const b of BOARD_KEYS) for (const id of boardPool(b)) expect(portrait.has(id), `${b}:${id}`).toBe(true)
})
test('대진 크기', () => {
  expect(bracketSize(16)).toBe(16); expect(bracketSize(31)).toBe(16)
  expect(bracketSize(15)).toBe(8); expect(bracketSize(8)).toBe(8); expect(bracketSize(7)).toBeNull()
})
test('여인 판: 지금 15명이라 8명, 중복 없음, 후보 안', () => {
  const e = drawEntrants('women', createRng(1))
  expect(e).toHaveLength(8)
  expect(new Set(e).size).toBe(8)
  for (const id of e) expect(boardPool('women')).toContain(id)
})
test('with: 후보면 반드시 포함, 후보 밖·없는 id는 무시', () => {
  for (let s = 0; s < 20; s++) expect(drawEntrants('random', createRng(s), 'guanyu')).toContain('guanyu')
  expect(drawEntrants('warrior', createRng(3), 'zhugeliang')).toHaveLength(16)
  expect(drawEntrants('random', createRng(3), 'nope')).toHaveLength(16)
})
test('같은 시드는 같은 대진, 다른 시드는 다른 순서', () => {
  expect(drawEntrants('warrior', createRng(7))).toEqual(drawEntrants('warrior', createRng(7)))
  expect(drawEntrants('warrior', createRng(7))).not.toEqual(drawEntrants('warrior', createRng(8)))
})
test('drawFromPool: 8명 후보는 전원이 섞여 나오고 후보 밖 with는 무시', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const e = drawFromPool(pool, createRng(5))
  expect([...e].sort()).toEqual(pool)
  expect(e).not.toEqual(pool)
  expect([...drawFromPool(pool, createRng(5), 'zzz')].sort()).toEqual(pool)
  expect(drawFromPool(pool, createRng(5), 'c')).toContain('c')
  expect(drawFromPool(['a', 'b', 'c'], createRng(1))).toEqual([])
})
test('drawEntrants는 drawFromPool(boardPool)과 같다', () => {
  expect(drawEntrants('random', createRng(11), 'guanyu')).toEqual(drawFromPool(boardPool('random'), createRng(11), 'guanyu'))
})
test('카드: 첫 문장과 funFacts, 초상화 경로', () => {
  const [c] = cupCards(['guanyu'])
  expect(c.name).toBe('관우')
  expect(c.line.length).toBeGreaterThan(10)
  expect(c.facts.length).toBeGreaterThanOrEqual(2)
  expect(c.portrait).toMatch(/^\/images\/samguk\//)
})
test('만난 장면: 관계로 이어진 쌍만', () => {
  const m = meetNotes(['liubei', 'guanyu', 'diaochan'])
  expect(m[pairKey('liubei', 'guanyu')]?.note.length).toBeGreaterThan(5)
  expect(m[pairKey('guanyu', 'diaochan')]).toBeUndefined()
})

test('GA 값: 모든 판 키 × 후보 id 조합이 24자 이하로 안전 값을 통과', async () => {
  const { isSafeValue } = await import('@/lib/analytics')
  for (const b of BOARD_KEYS) {
    expect(isSafeValue(b)).toBe(true)
    for (const id of boardPool(b)) expect(isSafeValue(`${b}_${id}`), `${b}_${id}`).toBe(true)
  }
})

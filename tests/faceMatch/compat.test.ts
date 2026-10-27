import { faceMatch, REL, type Rel } from '@/lib/faceMatch/compat'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import { animalTypeDB } from '@/lib/animalTypeDB'

const pairs = ANIMAL_KEYS.flatMap((a) => ANIMAL_KEYS.map((b) => [a, b] as const))
const keyOf = (name: string) => ANIMAL_KEYS.find((k) => animalTypeDB[k].name === name)!

test.each(REL)('%s: 대칭·결정적·정수 55~100, 최고 쌍은 정확히 100점', (rel) => {
  const scores = pairs.map(([a, b]) => {
    const s = faceMatch(a, b, rel).score
    expect(s).toBe(faceMatch(b, a, rel).score)
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(55)
    expect(s).toBeLessThanOrEqual(100)
    return s
  })
  expect(Math.max(...scores)).toBe(100)
  const avg = scores.reduce((x, y) => x + y, 0) / scores.length
  expect(avg).toBeGreaterThanOrEqual(70)
  expect(avg).toBeLessThanOrEqual(85)
})

test('animalTypeDB의 잘 맞는 쌍이 맞춰 가는 쌍보다 연인 궁합이 높다', () => {
  for (const a of ANIMAL_KEYS) {
    const best = animalTypeDB[a].compatibility.best.map(keyOf)
    const worst = animalTypeDB[a].compatibility.worst.map(keyOf)
    for (const b of best) for (const w of worst) {
      expect(faceMatch(a, b, 'lover').score, `${a}-${b} vs ${a}-${w}`).toBeGreaterThan(faceMatch(a, w, 'lover').score)
    }
  }
})

test('같은 동물상끼리는 친구 궁합이 연인 궁합보다 높다', () => {
  for (const a of ANIMAL_KEYS) expect(faceMatch(a, a, 'friend').score).toBeGreaterThan(faceMatch(a, a, 'lover').score)
})

test('짝사랑은 가능성 표현, 다른 관계 점수 2개를 함께 준다', () => {
  const r = faceMatch('cat', 'fox', 'crush')
  expect(r.headline).toMatch(/^짝사랑 성공 가능성 \d+%$/)
  expect(r.others.map((o) => o.rel).sort()).toEqual(['friend', 'lover'])
  expect(faceMatch('cat', 'fox', 'lover').headline).toMatch(/^연인 궁합 \d+점$/)
})

test('문구에 부정어가 없고 이유는 두 줄', () => {
  for (const rel of REL as readonly Rel[]) for (const [a, b] of pairs) {
    const r = faceMatch(a, b, rel)
    expect(r.lines).toHaveLength(2)
    expect([r.label, ...r.lines].join(' ')).not.toMatch(/최악|안 맞|나쁜|불가능|싫/)
  }
})

test('서로 다른 동물상 쌍도 관계에 따라 점수가 달라진다 (다른 관계도 궁금하게)', () => {
  const diffs = pairs.filter(([a, b]) => a !== b).filter(([a, b]) => new Set(REL.map((r) => faceMatch(a, b, r).score)).size > 1)
  expect(diffs.length / pairs.filter(([a, b]) => a !== b).length).toBeGreaterThan(0.8)
})

test('같은 동물상끼리는 "다른 매력" 문장을 쓰지 않는다', () => {
  for (const rel of REL) for (const a of ANIMAL_KEYS) expect(faceMatch(a, a, rel).lines[1]).not.toMatch(/다른 매력|다른 점/)
})

import { MBTI_TYPES, isMbti, compatScore, compatSummary, bestMatches, type Context } from '@/lib/mbti/compat'

const CTX: Context[] = ['love', 'friend', 'work']

test('isMbti', () => {
  expect(isMbti('INFP')).toBe(true)
  expect(isMbti('infp')).toBe(false)
  expect(isMbti('ABCD')).toBe(false)
})

test('대칭·범위·정수·결정성', () => {
  for (const a of MBTI_TYPES) for (const b of MBTI_TYPES) for (const c of CTX) {
    const s = compatScore(a, b, c)
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(55)
    expect(s).toBeLessThanOrEqual(100)
    expect(s).toBe(compatScore(b, a, c))
    expect(s).toBe(compatScore(a, b, c))
  }
})

test('분포: 평균 70~85, 최소 < 65, 최고 조합은 정확히 100점(공유 심리)', () => {
  const totals = MBTI_TYPES.flatMap((a) => MBTI_TYPES.map((b) => compatSummary(a, b).total))
  const avg = totals.reduce((x, y) => x + y, 0) / totals.length
  expect(avg).toBeGreaterThanOrEqual(70)
  expect(avg).toBeLessThanOrEqual(85)
  expect(Math.min(...totals)).toBeLessThan(65)
  expect(Math.max(...totals)).toBe(100)
})

test('같은 유형끼리는 그 유형의 최고점이 아니다', () => {
  for (const a of MBTI_TYPES) {
    const self = compatSummary(a, a).total
    const best = Math.max(...MBTI_TYPES.map((b) => compatSummary(a, b).total))
    expect(self, a).toBeLessThan(best)
  }
})

test('bestMatches: 3개, 자기 자신 제외, 점수 내림차순', () => {
  for (const a of MBTI_TYPES) for (const c of CTX) {
    const m = bestMatches(a, c)
    expect(m).toHaveLength(3)
    expect(m).not.toContain(a)
    const scores = m.map((b) => compatScore(a, b, c))
    expect([...scores].sort((x, y) => y - x)).toEqual(scores)
  }
})

test('설명 문장 4개, 부정적 표현 없음, 라벨 있음', () => {
  for (const a of MBTI_TYPES) for (const b of MBTI_TYPES) {
    const s = compatSummary(a, b)
    expect(s.lines).toHaveLength(4)
    expect(s.label.length).toBeGreaterThan(0)
    for (const l of s.lines) expect(l, `${a}-${b}`).not.toMatch(/나쁜|최악|안 맞|싫|문제가 많/)
  }
})

test('맥락별로도 100점 조합이 있다', () => {
  for (const c of CTX) expect(Math.max(...MBTI_TYPES.flatMap((a) => MBTI_TYPES.map((b) => compatScore(a, b, c)))), c).toBe(100)
})

test('널리 알려진 궁합표와 맞는다: E/I·J/P 반대 + S/N 같은 조합이 최상위', () => {
  for (const [a, b] of [['INFP', 'ENFJ'], ['ENFP', 'INTJ'], ['ISFJ', 'ESFP'], ['ESTJ', 'ISTP'], ['INFJ', 'ENTP']] as const)
    expect(compatSummary(a, b).total, `${a}-${b}`).toBeGreaterThanOrEqual(95)
})

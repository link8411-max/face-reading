import { GRADE_NAME, LIMIT_MS, grade, questionScore, total } from '@/lib/exam/score'

test('점수', () => {
  expect(LIMIT_MS).toBe(10_000)
  expect(questionScore({ correct: false, msLeft: 9000, hint: false })).toBe(0)
  expect(questionScore({ correct: true, msLeft: 10000, hint: false })).toBe(120)
  expect(questionScore({ correct: true, msLeft: 5000, hint: false })).toBe(110)
  expect(questionScore({ correct: true, msLeft: 9000, hint: true })).toBe(100)
  expect(questionScore({ correct: true, msLeft: -50, hint: false })).toBe(100)
  expect(questionScore({ correct: true, msLeft: 99999, hint: false })).toBe(120)
})

test('합계', () => {
  expect(total([
    { correct: true, msLeft: 10000, hint: false },
    { correct: false, msLeft: 5000, hint: false },
    { correct: true, msLeft: 5000, hint: false },
    { correct: true, msLeft: 9000, hint: true },
    { correct: false, msLeft: 0, hint: false },
  ])).toEqual({ score: 120 + 110 + 100, correct: 3, bonus: 30 })
})

test('등급 경계', () => {
  expect(grade(5, 50)).toBe(1); expect(grade(5, 49)).toBe(2)
  expect(grade(4, 40)).toBe(3); expect(grade(4, 39)).toBe(4)
  expect(grade(3, 30)).toBe(5); expect(grade(3, 29)).toBe(6)
  expect(grade(2, 40)).toBe(7); expect(grade(1, 20)).toBe(8); expect(grade(0, 0)).toBe(9)
})

test('별명 9개, 이모지·금지어 없음', () => {
  expect(Object.keys(GRADE_NAME)).toHaveLength(9)
  for (let g = 1; g <= 9; g++) {
    const n = GRADE_NAME[g]
    expect(n.length).toBeGreaterThan(0)
    expect(/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(n)).toBe(false)
    expect(n).not.toMatch(/신상|최신|요즘|꼴찌|바보|멍청|한심/)
  }
  expect(GRADE_NAME[3]).toBe('눈팅은 하는 사람')
})

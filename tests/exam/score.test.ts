import type { Question } from '@/lib/exam/types'
import { GRADE_NAME, MAX_LIMIT_MS, MIN_LIMIT_MS, grade, questionScore, timeLimitMs, total } from '@/lib/exam/score'

test('점수', () => {
  expect(MIN_LIMIT_MS).toBe(12_000)
  expect(MAX_LIMIT_MS).toBe(30_000)
  expect(questionScore({ correct: false, msLeft: 9000, hint: false, limitMs: 10_000 })).toBe(0)
  expect(questionScore({ correct: true, msLeft: 10000, hint: false, limitMs: 10_000 })).toBe(120)
  expect(questionScore({ correct: true, msLeft: 5000, hint: false, limitMs: 10_000 })).toBe(110)
  expect(questionScore({ correct: true, msLeft: 9000, hint: true, limitMs: 10_000 })).toBe(100)
  expect(questionScore({ correct: true, msLeft: -50, hint: false, limitMs: 10_000 })).toBe(100)
  expect(questionScore({ correct: true, msLeft: 99999, hint: false, limitMs: 10_000 })).toBe(120)
})

test('합계', () => {
  expect(total([
    { correct: true, msLeft: 10000, hint: false, limitMs: 10_000 },
    { correct: false, msLeft: 5000, hint: false, limitMs: 10_000 },
    { correct: true, msLeft: 5000, hint: false, limitMs: 10_000 },
    { correct: true, msLeft: 9000, hint: true, limitMs: 10_000 },
    { correct: false, msLeft: 0, hint: false, limitMs: 10_000 },
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

const mk = (ask: string, options: string[], over: Partial<Question> = {}): Question => ({
  term: 't', kind: 'word', when: '2026', badge: '', level: 1, type: 'meaning', ask, options, answer: 0,
  explain: { meaning: '', usage: '', origin: '' }, ...over,
})

test('timeLimitMs: 최소 12초, 최대 30초, 100자쯤이면 22초', () => {
  expect(timeLimitMs(mk('맞으면 O, 틀리면 X', ['O', 'X']))).toBe(12_000)
  expect(timeLimitMs(mk('가'.repeat(90), ['나'.repeat(9), '다']))).toBe(22_000) // 100자 -> 6000+16000
  expect(timeLimitMs(mk('가'.repeat(1000), ['나']))).toBe(30_000)
  expect(timeLimitMs(mk('공 백 은 빼', ['a b']))).toBe(12_000)
})

test('timeLimitMs: 대화 문제는 말풍선 글자를 센다', () => {
  const skit = { form: 'blank' as const, lines: [{ who: '지수', text: '가'.repeat(60) }, { who: '나', text: '____' + '나'.repeat(36) }], options: ['다'.repeat(5)], answer: 0 }
  expect(timeLimitMs(mk('', skit.options, { type: 'skit', skit }))).toBe(23_000) // 60+40+5=105자 -> 22800 -> 23초
})

test('제한 시간에 비례한 가산점', () => {
  const a = (msLeft: number, over = {}) => questionScore({ correct: true, msLeft, hint: false, limitMs: 20_000, ...over })
  expect(a(20_000)).toBe(120)
  expect(a(10_000)).toBe(110)
  expect(a(-5)).toBe(100)
  expect(a(10_000, { hint: true })).toBe(100)
  expect(a(99_999)).toBe(120)
})

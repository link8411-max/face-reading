import { duelOutcome, encodeShared, examShareUrl, parseShared, type Shared } from '@/lib/exam/link'

const base: Shared = { round: 3, marks: 'OXOOX', score: 345, grade: 5, hint: true }

test('왕복', () => {
  expect(encodeShared(base)).toBe('3-OXOOX-345-5h')
  expect(parseShared(encodeShared(base), 14)).toEqual(base)
  const s = { round: 14, marks: 'OOOOO', score: 600, grade: 1, hint: false }
  expect(parseShared(encodeShared(s), 14)).toEqual(s)
})

test.each([
  '', 'abc', '0-OOOOO-600-1', '15-OOOOO-600-1', '3-OOOO-400-3', '3-OOOOZ-400-3', '3-OXOOX-9999-5',
  '3-OXOOX-100-5', '3-OXOOX-345-0', '3-OXOOX-345-10', '999-OOOOO-9999-0', '03-OXOOX-345-5', '3-OXOOX-345-5x',
  '3-OXOOX-361-5', '3-OXOOX-299-5', '3-oxoox-345-5', '3-OXOOX-345-5hh', '-3-OXOOX-345-5',
])('잘못된 코드 %s', (c) => expect(parseShared(c, 14)).toBeNull())

test('경계 점수는 받는다', () => {
  expect(parseShared('3-OXOOX-300-6', 14)).not.toBeNull()
  expect(parseShared('3-OXOOX-360-5', 14)).not.toBeNull()
  expect(parseShared('3-XXXXX-0-9', 14)).not.toBeNull()
})

test('주소에 utm이 붙는다', () =>
  expect(examShareUrl({ round: 1, marks: 'OOOOO', score: 600, grade: 1, hint: false })).toBe(
    'https://unse-ai.com/exam/meme/r/1-OOOOO-600-1?utm_source=share&utm_medium=friend_link&utm_campaign=exam_meme',
  ))

test('승패', () => {
  expect(duelOutcome({ ...base, score: 345 }, { ...base, score: 300 })).toBe('win')
  expect(duelOutcome({ ...base, score: 300 }, { ...base, score: 345 })).toBe('lose')
  expect(duelOutcome({ ...base, score: 300 }, { ...base, score: 300 })).toBe('draw')
})

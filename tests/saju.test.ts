import KoreanLunarCalendar from 'korean-lunar-calendar'
import { 년주계산, 월주계산, 일주계산, 띠찾기, 사주분석 } from '@/lib/saju'

const pillars = (y: number, m: number, d: number) => {
  const a = 년주계산(y, m, d), b = 월주계산(y, m, d), c = 일주계산(y, m, d)
  return `${a.천간}${a.지지} ${b.천간}${b.지지} ${c.천간}${c.지지}`
}

test.each([
  [1990, 5, 15, '경오 신사 경진'],
  [2024, 2, 10, '갑진 병인 갑진'],
  [2000, 1, 1, '기묘 병자 무오'],
])('%i-%i-%i 사주 = %s', (y, m, d, expected) => {
  expect(pillars(y, m, d)).toBe(expected)
})

test('1900-01-01 일주는 갑술', () => {
  const c = 일주계산(1900, 1, 1)
  expect(c.천간 + c.지지).toBe('갑술')
})

test('입춘(2/4) 기준 년주와 띠', () => {
  expect(년주계산(2027, 2, 3).천간 + 년주계산(2027, 2, 3).지지).toBe('병오')
  expect(띠찾기(2027, 2, 3)).toBe('말')
  expect(년주계산(2027, 2, 4).천간 + 년주계산(2027, 2, 4).지지).toBe('정미')
  expect(띠찾기(2027, 2, 4)).toBe('양')
})

test('1950~2026 표본 날짜에서 일주가 한국천문연구원 기반 달력과 같다', () => {
  const cal = new KoreanLunarCalendar()
  for (let y = 1950; y <= 2026; y++) for (const [m, d] of [[1, 15], [5, 15], [10, 3]]) {
    cal.setSolarDate(y, m, d)
    const expected = cal.getKoreanGapja().day.replace('일', '')
    const c = 일주계산(y, m, d)
    expect(c.천간 + c.지지, `${y}-${m}-${d}`).toBe(expected)
  }
})

test('사주분석은 일간·오행을 바로잡힌 일주로 계산한다', () => {
  const r = 사주분석(1990, 5, 15)
  expect(r.사주).toEqual({ 년주: '경오', 월주: '신사', 일주: '경진' })
  expect(r.일간).toBe('경')
  expect(r.일간오행).toBe('금')
})

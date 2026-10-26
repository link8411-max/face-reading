import KoreanLunarCalendar from 'korean-lunar-calendar'
import { computeFortune } from '@/lib/fortuneService'
import { validateBirthDate } from '@/lib/birthDate'
import { 띠찾기 } from '@/lib/saju'
import { readFileSync } from 'node:fs'

test('음력 생일은 양력으로 바꿔 같은 사주로 계산한다', () => {
  const lunar = computeFortune({ year: 1990, month: 4, day: 21, isLunar: true, isLeapMonth: false, hour: '모름' })
  const solar = computeFortune({ year: 1990, month: 5, day: 15, isLunar: false, isLeapMonth: false, hour: '모름' })
  if ('error' in lunar || 'error' in solar) throw new Error('unexpected')
  expect(lunar.사주정보.사주).toEqual(solar.사주정보.사주)
  expect(lunar.사주정보.양력).toEqual({ year: 1990, month: 5, day: 15 })
})

test('윤달을 구분해서 변환한다', () => {
  const cal = new KoreanLunarCalendar()
  cal.setLunarDate(2023, 2, 15, true)
  const expected = cal.getSolarCalendar()
  const leap = computeFortune({ year: 2023, month: 2, day: 15, isLunar: true, isLeapMonth: true, hour: '모름' })
  const normal = computeFortune({ year: 2023, month: 2, day: 15, isLunar: true, isLeapMonth: false, hour: '모름' })
  if ('error' in leap || 'error' in normal) throw new Error('unexpected')
  expect(leap.사주정보.양력).toEqual({ year: expected.year, month: expected.month, day: expected.day })
  expect(leap.사주정보.양력).not.toEqual(normal.사주정보.양력)
})

test('없는 음력 날짜(윤달이 없는 해의 윤달)는 오류', () => {
  expect(computeFortune({ year: 2024, month: 3, day: 1, isLunar: true, isLeapMonth: true, hour: '모름' })).toEqual({ error: '존재하지 않는 음력 날짜예요. 윤달 여부를 확인해 주세요.' })
})

test('음력은 일자를 30일까지 받는다', () => {
  expect(validateBirthDate({ year: '1990', month: '2', day: '30' }, new Date(2026, 9, 26), { lunar: true }).ok).toBe(true)
  expect(validateBirthDate({ year: '1990', month: '2', day: '31' }, new Date(2026, 9, 26), { lunar: true }).ok).toBe(false)
})

test('오늘의 운세 띠는 입춘 기준: 입춘 전 출생이면 전년도 띠', () => {
  expect(띠찾기(1990, 1, 15)).toBe('뱀')
  expect(띠찾기(1990, 3, 1)).toBe('말')
  const daily = readFileSync('src/app/fortune/daily/page.tsx', 'utf8')
  expect(daily).toContain('입춘')
  expect(daily).not.toContain('음력 설 전')
})

test('신년운세 화면에 "사주명리학은 음력 기준" 같은 잘못된 안내가 없다', () => {
  expect(readFileSync('src/app/fortune/FortuneClient.tsx', 'utf8')).not.toContain('음력 기준입니다')
})

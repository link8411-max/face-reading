import { sanitizeDigits, validateBirthDate, validateBirthYear, MIN_YEAR } from '@/lib/birthDate'

const NOW = new Date(2026, 9, 26) // 2026-10-26

test('숫자만 남기고 자릿수를 자른다', () => {
  expect(sanitizeDigits('19901234', 4)).toBe('1990')
  expect(sanitizeDigits('1a9-9', 4)).toBe('199')
  expect(sanitizeDigits('045', 2)).toBe('04')
})

test('아직 다 입력하지 않았으면 오류 문구 없이 미완료', () => {
  expect(validateBirthDate({ year: '', month: '', day: '' }, NOW)).toEqual({ ok: false, error: null })
  expect(validateBirthDate({ year: '199', month: '', day: '' }, NOW)).toEqual({ ok: false, error: null })
})

test('올바른 날짜는 통과', () => {
  expect(validateBirthDate({ year: '1990', month: '5', day: '15' }, NOW).ok).toBe(true)
  expect(validateBirthDate({ year: '2024', month: '02', day: '29' }, NOW).ok).toBe(true)
})

test('존재하지 않는 날짜를 막는다', () => {
  expect(validateBirthDate({ year: '1990', month: '2', day: '31' }, NOW)).toMatchObject({ ok: false, error: '2월은 28일까지 있어요' })
  expect(validateBirthDate({ year: '2023', month: '2', day: '29' }, NOW)).toMatchObject({ ok: false, error: '2월은 28일까지 있어요' })
  expect(validateBirthDate({ year: '1990', month: '4', day: '31' }, NOW)).toMatchObject({ ok: false, error: '4월은 30일까지 있어요' })
  expect(validateBirthDate({ year: '1990', month: '13', day: '1' }, NOW)).toMatchObject({ ok: false, error: '월은 1~12 사이로 입력해 주세요' })
  expect(validateBirthDate({ year: '1990', month: '1', day: '0' }, NOW).ok).toBe(false)
})

test('연도 범위와 미래 날짜를 막는다', () => {
  expect(validateBirthDate({ year: '3000', month: '1', day: '1' }, NOW)).toMatchObject({ ok: false, error: `${MIN_YEAR}~2026년 사이로 입력해 주세요` })
  expect(validateBirthDate({ year: '1899', month: '1', day: '1' }, NOW).ok).toBe(false)
  expect(validateBirthDate({ year: '2026', month: '12', day: '1' }, NOW)).toMatchObject({ ok: false, error: '아직 오지 않은 날짜예요' })
})

test('출생년도만 받는 경우 (오늘의 운세): 올해 태어난 아이까지 허용', () => {
  expect(validateBirthYear('2026', NOW).ok).toBe(true)
  expect(validateBirthYear('2025', NOW).ok).toBe(true)
  expect(validateBirthYear('2027', NOW).ok).toBe(false)
  expect(validateBirthYear('19', NOW)).toEqual({ ok: false, error: null })
})

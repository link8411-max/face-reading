import { readFileSync, existsSync } from 'node:fs'

test('홈 띠 고르기는 엔진의 띠 모드를 쓰고 날짜는 마운트 뒤 계산', () => {
  const src = readFileSync('src/components/home/ZodiacPicker.tsx', 'utf8')
  expect(src).toContain('@/lib/dailyEngine')
  expect(src).not.toContain('일간운세')
  expect(src).toMatch(/useEffect\(/)
  expect(src).toContain("kind: '띠'")
  expect(src).toContain('년생을 넣으면 더 정확해요')
})

test('요일표 운세는 사라졌다', () => {
  expect(existsSync('src/lib/dailyFortune.ts')).toBe(false)
  expect(readFileSync('src/lib/fortuneDB.ts', 'utf8')).not.toContain('일간운세')
})

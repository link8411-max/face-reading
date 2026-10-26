import { readFileSync } from 'node:fs'
import { SEASON } from '@/content/season'
import { HOME_FAQS } from '@/content/homeFaq'

test('시즌 히어로 설정: 2027 신년운세로 연결', () => {
  expect(SEASON.cta.href).toBe('/fortune')
  expect(SEASON.chip).toContain('2027')
})

test('홈은 서버 페이지이고 시즌 설정·FAQ 데이터를 쓴다', () => {
  const src = readFileSync('src/app/page.tsx', 'utf8')
  expect(src).not.toMatch(/^"use client"/)
  expect(src).toContain('SeasonHero')
  expect(src).toContain('ZodiacPicker')
  expect(src).toContain('CategoryTabs')
  expect(src).toContain('HOME_FAQS')
})

test('홈에 근거 없는 참여자 수·순위 숫자가 없다', () => {
  const all = ['src/app/page.tsx', 'src/components/home/SeasonHero.tsx', 'src/components/home/ZodiacPicker.tsx', 'src/components/home/CategoryTabs.tsx', 'src/content/season.ts'].map((f) => readFileSync(f, 'utf8')).join('\n')
  expect(all).not.toMatch(/\d[\d,]*명\s*(확인|참여|이용)|인기\s*순위|HOT/)
})

test('FAQ는 5개 이상이고 사실과 맞는 문구다', () => {
  expect(HOME_FAQS.length).toBeGreaterThanOrEqual(5)
  const text = JSON.stringify(HOME_FAQS)
  expect(text).toContain('丁未年')
  expect(text).not.toMatch(/Gemini|하루 1회|수백 개/)
})

test('띠 고르기는 요일을 마운트 뒤에 계산한다(서버·브라우저 날짜 불일치 방지)', () => {
  const src = readFileSync('src/components/home/ZodiacPicker.tsx', 'utf8')
  expect(src).toContain('useEffect')
  expect(src).not.toMatch(/^const .*new Date\(\)/m)
})

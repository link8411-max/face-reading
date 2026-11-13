import { readFileSync } from 'node:fs'
import { CATEGORIES } from '@/content/navigation'

test('글꼴은 쓰는 굵기만: Pretendard 가변(400~800) 한 파일, Gowun Batang 400·700(미리 받지 않음), 부적 붓 글꼴 500 하나', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).toMatch(/PretendardVariable\.woff2", weight: "400 800"/)
  expect(layout).toMatch(/GowunBatang-Regular\.woff2", weight: "400"/)
  expect(layout).toMatch(/GowunBatang-Bold\.woff2", weight: "700"/)
  expect(layout).toMatch(/LXGWWenKaiTC-Bujeok\.woff2", weight: "500"/)
  const gowun = layout.slice(layout.indexOf('GowunBatang-Regular'), layout.indexOf('GowunBatang-Regular') + 400)
  expect(gowun).toMatch(/preload: false/)
})

test('globals.css의 body 규칙이 글꼴·배경·글자색을 덮어쓰지 않는다', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  const body = css.match(/(^|\n)body\s*\{[^}]*\}/)?.[0] ?? ''
  expect(body).not.toMatch(/font-family|background|color/)
})

test('오늘의 운세는 일진으로 날마다 바뀌므로 요일별이라고 쓰지 않는다', () => {
  const unse = CATEGORIES.find((c) => c.key === 'unse')!
  const text = JSON.stringify(unse)
  expect(text).not.toMatch(/요일/)
  expect(text).toMatch(/매일|날마다/)
})

test('홈 클라이언트 번들에 운세 DB 전체를 싣지 않는다(일간운세만)', () => {
  const src = readFileSync('src/components/home/ZodiacPicker.tsx', 'utf8')
  expect(src).not.toContain('@/lib/fortuneDB')
  expect(src).toContain('@/lib/dailyEngine')
  expect(src).not.toContain('components/fortune/DailyFortuneCard')
  expect(src).not.toContain('fortuneDB')
})

test('푸터 묶음 제목은 h4가 아니다(제목 단계 건너뜀 방지)', () => {
  expect(readFileSync('src/app/layout.tsx', 'utf8')).not.toContain('<h4')
})

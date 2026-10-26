import { readFileSync } from 'node:fs'
import { CATEGORIES } from '@/content/navigation'

test('글꼴은 쓰는 굵기만: Sans 400·700, Gowun Batang 400·700', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).toMatch(/Noto_Sans_KR\(\{[\s\S]*?weight: \["400", "700"\]/)
  expect(layout).toMatch(/Gowun_Batang\(\{[\s\S]*?weight: \["400", "700"\]/)
})

test('globals.css의 body 규칙이 글꼴·배경·글자색을 덮어쓰지 않는다', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  const body = css.match(/(^|\n)body\s*\{[^}]*\}/)?.[0] ?? ''
  expect(body).not.toMatch(/font-family|background|color/)
})

test('오늘의 운세는 요일별 내용이라 "매일"이라고 과장하지 않는다', () => {
  const unse = CATEGORIES.find((c) => c.key === 'unse')!
  const text = JSON.stringify(unse)
  expect(text).not.toMatch(/매일/)
})

test('홈 클라이언트 번들에 운세 DB 전체를 싣지 않는다(일간운세만)', () => {
  const src = readFileSync('src/components/home/ZodiacPicker.tsx', 'utf8')
  expect(src).not.toContain('@/lib/fortuneDB')
  expect(src).toContain('@/lib/dailyFortune')
})

test('푸터 묶음 제목은 h4가 아니다(제목 단계 건너뜀 방지)', () => {
  expect(readFileSync('src/app/layout.tsx', 'utf8')).not.toContain('<h4')
})

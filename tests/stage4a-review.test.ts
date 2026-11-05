import { readFileSync } from 'node:fs'
import { CATEGORIES } from '@/content/navigation'

test('글꼴은 쓰는 굵기만: Sans 400·700, Gowun Batang 400·700', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  // next/font/local: 파일마다 굵기를 적는다. 400·700 말고 다른 굵기 파일은 싣지 않는다
  for (const name of ['NotoSansKR', 'GowunBatang']) {
    expect(layout).toMatch(new RegExp(`${name}-Regular\\.woff2", weight: "400"`))
    expect(layout).toMatch(new RegExp(`${name}-Bold\\.woff2", weight: "700"`))
  }
  const weights = [...layout.matchAll(/weight: "(\d+)"/g)].map((m) => m[1])
  expect(new Set(weights)).toEqual(new Set(['400', '700']))
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

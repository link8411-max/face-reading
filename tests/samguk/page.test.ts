import { readFileSync, existsSync } from 'node:fs'

test('삼국지 페이지는 /api/samguk를 호출하지 않는다', () => {
  expect(readFileSync('src/app/samguk/page.tsx', 'utf8')).not.toContain('/api/samguk')
})

test('api/samguk 라우트가 없다', () => {
  expect(existsSync('src/app/api/samguk/route.ts')).toBe(false)
})

test('삼국지 페이지는 성별 선택과 브라우저 매칭을 쓴다', () => {
  const src = readFileSync('src/app/samguk/page.tsx', 'utf8')
  expect(src).toContain('matchCharacter')
  expect(src).toContain('detectLandmarks')
})

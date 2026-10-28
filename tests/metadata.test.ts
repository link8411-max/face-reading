import { readFileSync } from 'node:fs'
import { metadata } from '@/app/face2/layout'

test('/face2 title에 주력 키워드가 있다', () => {
  const title = String(metadata.title)
  expect(title).toContain('AI 관상 테스트')
  expect(title).toContain('무료')
})

test('/face2 H1이 AI 관상 테스트다 (TestHeader가 title을 h1로 렌더)', () => {
  expect(readFileSync('src/app/face2/page.tsx', 'utf8')).toContain('<TestHeader title="AI 관상 테스트"')
  expect(readFileSync('src/components/test/TestHeader.tsx', 'utf8')).toMatch(/<h1[^>]*>\{title\}<\/h1>/)
})

test('루트 layout에는 FAQPage가 없고 홈에만 있다', () => {
  expect(readFileSync('src/app/layout.tsx', 'utf8')).not.toContain('FAQPage')
  expect(readFileSync('src/app/page.tsx', 'utf8')).toContain('FAQPage')
})

test('삼국지 footer에 옛 이름이 없다', () => {
  expect(readFileSync('src/app/samguk/(match)/page.tsx', 'utf8')).not.toContain('Samguk Persona')
})

test('/fortune 가이드는 하위 라우트(/fortune/daily)에 중첩되지 않게 layout이 아닌 page에서 렌더한다', () => {
  expect(readFileSync('src/app/fortune/layout.tsx', 'utf8')).not.toContain('PageGuide')
  expect(readFileSync('src/app/fortune/page.tsx', 'utf8')).toContain('<PageGuide route="/fortune" />')
})

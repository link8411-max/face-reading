import { readFileSync } from 'node:fs'
import { SITEMAP_ROUTES } from '@/app/sitemap'
import { metadata as mbtiMeta } from '@/app/mbti/page'
import { metadata as faceMeta } from '@/app/face-tests/page'
import { metadata as unseMeta } from '@/app/unse/page'

test('사이트맵: /face-tests·/unse 포함 (/mbti는 5단계에서 실제 페이지가 되어 포함)', () => {
  const r = SITEMAP_ROUTES as readonly string[]
  expect(r).toContain('/face-tests')
  expect(r).toContain('/unse')
  expect(r).toContain('/mbti')
})

test('/mbti는 5단계 이후 검색 허용', () => {
  expect(mbtiMeta.robots).toBeUndefined()
})

test('허브는 자기 canonical을 가진다', () => {
  expect(faceMeta.alternates?.canonical).toBe('https://unse-ai.com/face-tests')
  expect(unseMeta.alternates?.canonical).toBe('https://unse-ai.com/unse')
})

test('허브는 공용 CategoryList로 항목을 그린다', () => {
  for (const f of ['src/app/face-tests/page.tsx', 'src/app/unse/page.tsx']) expect(readFileSync(f, 'utf8')).toContain('<CategoryList')
})

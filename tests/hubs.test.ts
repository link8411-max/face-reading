import { readFileSync } from 'node:fs'
import { SITEMAP_ROUTES } from '@/app/sitemap'
import { metadata as mbtiMeta } from '@/app/mbti/page'
import { metadata as faceMeta } from '@/app/face-tests/page'
import { metadata as unseMeta } from '@/app/unse/page'

test('사이트맵: /face-tests·/unse 포함, /mbti 제외', () => {
  const r = SITEMAP_ROUTES as readonly string[]
  expect(r).toContain('/face-tests')
  expect(r).toContain('/unse')
  expect(r).not.toContain('/mbti')
})

test('/mbti는 검색 제외(noindex)', () => {
  expect(mbtiMeta.robots).toMatchObject({ index: false })
})

test('허브는 자기 canonical을 가진다', () => {
  expect(faceMeta.alternates?.canonical).toBe('https://unse-ai.com/face-tests')
  expect(unseMeta.alternates?.canonical).toBe('https://unse-ai.com/unse')
})

test('허브는 공용 CategoryList로 항목을 그린다', () => {
  for (const f of ['src/app/face-tests/page.tsx', 'src/app/unse/page.tsx']) expect(readFileSync(f, 'utf8')).toContain('<CategoryList')
})

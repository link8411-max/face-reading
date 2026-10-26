import { SITEMAP_ROUTES } from '@/app/sitemap'
import { metadata as hubMeta } from '@/app/mbti/page'
import { generateMetadata, generateStaticParams } from '@/app/mbti/[type]/page'
import { MBTI_SLUGS } from '@/content/mbtiTypes'

test('사이트맵: /mbti, /mbti/match, 16유형', () => {
  const r = SITEMAP_ROUTES as readonly string[]
  for (const p of ['/mbti', '/mbti/match', ...MBTI_SLUGS.map((s) => `/mbti/${s}`)]) expect(r, p).toContain(p)
})

test('/mbti 허브는 검색 허용(noindex 아님)과 canonical', () => {
  expect(hubMeta.robots).toBeUndefined()
  expect(hubMeta.alternates?.canonical).toBe('https://unse-ai.com/mbti')
})

test('유형 페이지 16개 정적 생성과 메타', async () => {
  expect(generateStaticParams().map((p) => p.type).sort()).toEqual([...MBTI_SLUGS].sort())
  const m = await generateMetadata({ params: Promise.resolve({ type: 'infp' }) })
  expect(String(m.title)).toContain('INFP')
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/mbti/infp')
})

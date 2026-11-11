import sitemap, { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap'

test('모든 라우트가 고정된 lastModified를 가진다', () => {
  for (const r of SITEMAP_ROUTES) expect(LAST_MODIFIED[r]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

test('sitemap 항목은 new Date()가 아니라 LAST_MODIFIED 값을 쓴다', () => {
  const entries = sitemap()
  expect(entries).toHaveLength(SITEMAP_ROUTES.length)
  for (const e of entries) {
    const route = e.url.replace('https://unse-ai.com', '')
    expect(e.lastModified).toBe(LAST_MODIFIED[route])
  }
})

test('밈 능력고사: /exam/meme은 사이트맵에 있고 공유 착지(/exam/meme/r/)는 없다', () => {
  expect(SITEMAP_ROUTES).toContain('/exam/meme')
  expect(LAST_MODIFIED['/exam/meme']).toBe('2026-11-11')
  expect(SITEMAP_ROUTES.some((r) => r.startsWith('/exam/meme/r'))).toBe(false)
  expect(sitemap().map((e) => e.url)).toContain('https://unse-ai.com/exam/meme')
})

test('부적: /bujeok은 사이트맵에 있고 선물 착지(/bujeok/r/)는 없다', () => {
  expect(SITEMAP_ROUTES).toContain('/bujeok')
  expect(LAST_MODIFIED['/bujeok']).toBe('2026-11-11')
  expect(SITEMAP_ROUTES.some((r) => r.startsWith('/bujeok/r'))).toBe(false)
  expect(sitemap().map((e) => e.url)).toContain('https://unse-ai.com/bujeok')
})

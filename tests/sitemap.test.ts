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

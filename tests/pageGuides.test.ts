import { pageGuides, faqJsonLd, type GuideRoute } from '@/content/pageGuides'
import { SITEMAP_ROUTES } from '@/app/sitemap'

const routes = Object.keys(pageGuides) as GuideRoute[]

test.each(routes)('%s 가이드 분량', (route) => {
  const g = pageGuides[route]!
  expect(g.intro.join('').length).toBeGreaterThanOrEqual(400)
  expect(g.howTo.length).toBeGreaterThanOrEqual(3)
  expect(g.highlights.length).toBeGreaterThanOrEqual(3)
  expect(g.faqs.length).toBeGreaterThanOrEqual(4)
})

test.each(routes)('%s related는 자기 자신이 아니고 sitemap에 있는 라우트', (route) => {
  const g = pageGuides[route]!
  expect(g.related.length).toBeGreaterThan(0)
  for (const r of g.related) {
    expect(r).not.toBe(route)
    expect(SITEMAP_ROUTES as readonly string[]).toContain(r)
  }
})

test('faqJsonLd는 < 를 이스케이프한다', () => {
  const faqs = pageGuides['/face2']!.faqs
  faqs.push({ q: 'x', a: '</script><b>' })
  try {
    const json = faqJsonLd('/face2')
    expect(json).not.toContain('</script>')
    const parsed = JSON.parse(json)
    expect(parsed['@type']).toBe('FAQPage')
    expect(parsed.mainEntity).toHaveLength(faqs.length)
  } finally {
    faqs.pop()
  }
})

test('모든 GuideRoute에 가이드가 있다', () => {
  const all: GuideRoute[] = ['/face2', '/animal', '/samguk', '/fortune', '/fortune/daily']
  for (const r of all) expect(pageGuides[r], r).toBeDefined()
})

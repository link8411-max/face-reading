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

test('/fortune 가이드는 코드가 하지 않는 시주·음력 계산을 주장하지 않는다', () => {
  const text = JSON.stringify(pageGuides['/fortune'])
  // 사주팔자 일반 정의(여덟 글자)는 허용, 우리 계산이 여덟 글자/네 기둥이라는 주장만 금지
  expect(text).not.toContain('여덟 글자를 보여')
  expect(text).not.toContain('네 기둥의 천간')
  expect(text).not.toContain('더 자세한 풀이')
  expect(text).toContain('여섯 글자')
  expect(text).toContain('양력')
})

test('/samguk 가이드는 사진이 외부 AI(Gemini)로 전송됨을 밝힌다', () => {
  const g = pageGuides['/samguk']
  expect(g.faqs.find((f) => f.q.includes('사진'))!.a).toContain('Google Gemini')
  expect(g.intro.join('')).toContain('Google Gemini')
})

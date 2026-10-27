import { pageGuides, faqJsonLd, type GuideRoute } from '@/content/pageGuides'
import { SITEMAP_ROUTES } from '@/app/sitemap'

const routes = Object.keys(pageGuides) as GuideRoute[]

test.each(routes)('%s 가이드 분량', (route) => {
  const g = pageGuides[route]!
  expect(g.intro.join("").length).toBeGreaterThanOrEqual(300)
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
  const all: GuideRoute[] = ['/face2', '/animal', '/samguk', '/fortune', '/fortune/daily', '/fortune/mbti']
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

test('/samguk 가이드는 브라우저 안에서만 분석함을 밝히고 Gemini를 언급하지 않는다', () => {
  const text = JSON.stringify(pageGuides['/samguk'])
  expect(text).not.toContain('Gemini')
  expect(pageGuides['/samguk'].faqs.find((f) => f.q.includes('사진'))!.a).toContain('브라우저')
})

test('운세 가이드는 바뀐 계산 방식(음력 변환, 입춘 기준, 근사)을 사실대로 말한다', () => {
  const fortune = JSON.stringify(pageGuides['/fortune'])
  const daily = JSON.stringify(pageGuides['/fortune/daily'])
  expect(fortune).not.toContain('바꿔 계산하지는 않아요')
  expect(fortune).not.toContain('지금은 양력 생일을 기준으로 계산해요')
  expect(fortune).toContain('입춘')
  expect(fortune).toContain('윤달')
  expect(fortune).toContain('하루 정도')
  expect(daily).not.toContain('음력 설')
  expect(daily).toContain('입춘')
})

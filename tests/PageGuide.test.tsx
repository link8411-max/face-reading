import { renderToStaticMarkup } from 'react-dom/server'
import PageGuide from '@/components/PageGuide'
import { pageGuides, TEST_LINKS, type GuideRoute } from '@/content/pageGuides'

test('본문과 FAQ JSON-LD를 렌더한다', () => {
  const g = pageGuides['/face2']!
  const html = renderToStaticMarkup(<PageGuide route="/face2" />)
  expect(html).toContain(g.heading)
  expect(html).toContain(g.faqs[0].q)
  expect(html).toContain('application/ld+json')
  expect(html).toContain('no-screenshot')
  expect(html).toContain(TEST_LINKS[g.related[0]].label)
  expect(html).toContain(`href="${g.related[0]}"`)
})

test('데이터 없는 라우트는 아무것도 렌더하지 않는다', () => {
  const missing = (['/animal', '/samguk', '/fortune', '/fortune/daily'] as GuideRoute[]).find((r) => !pageGuides[r])
  if (!missing) return
  expect(renderToStaticMarkup(<PageGuide route={missing} />)).toBe('')
})

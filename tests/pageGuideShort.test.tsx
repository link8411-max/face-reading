import { renderToStaticMarkup } from 'react-dom/server'
import PageGuide from '@/components/PageGuide'
import { pageGuides, type GuideRoute } from '@/content/pageGuides'

const routes = Object.keys(pageGuides) as GuideRoute[]

// 하단 설명이 길다는 피드백: 처음엔 2~3줄 요약만, 나머지는 접어 둔다(HTML에는 남겨 색인 유지)
test.each(routes)('%s 요약은 2~3줄 분량이다', (route) => {
  const s = pageGuides[route].summary
  expect(s.length).toBeGreaterThanOrEqual(40)
  expect(s.length).toBeLessThanOrEqual(120)
})

test.each(routes)('%s 본문은 "자세히 보기" 안에 접혀 있다', (route) => {
  const g = pageGuides[route]
  const html = renderToStaticMarkup(<PageGuide route={route} />)
  const before = html.slice(0, html.indexOf('<details'))
  expect(before).toContain(g.summary)
  expect(before).not.toContain(g.intro[0])
  expect(html).toContain('자세히 보기')
  expect(html).toContain(g.intro[0])
  expect(html).not.toContain('이렇게 해요')
})

test.each(routes)('%s 기술 설명은 본문이 아니라 FAQ에 있다', (route) => {
  const body = JSON.stringify([pageGuides[route].summary, pageGuides[route].intro, pageGuides[route].highlights])
  for (const word of ['천문연구원', '근사', '윤달', '저장되지', '서버로 전송']) expect(body, word).not.toContain(word)
})

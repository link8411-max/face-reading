import { renderToStaticMarkup } from 'react-dom/server'
import MbtiArticle from '@/components/mbti/MbtiArticle'
import { mbtiProfiles } from '@/content/mbtiTypes'
import { MBTI_TYPES, bestMatches } from '@/lib/mbti/compat'

// 본문 첫 요약: 검색 미리보기가 첫 제목·문단을 쓰므로 별명·궁합 1위·직업·여행지를 맨 앞에 둔다
test.each(MBTI_TYPES)('%s: "한눈에 보기"가 "이런 사람"보다 앞에 있고 궁합 1위·직업·여행지·운세 링크가 있다', (T) => {
  const html = renderToStaticMarkup(<MbtiArticle type={T} />)
  const lead = html.indexOf(`${T} 한눈에 보기`)
  expect(lead).toBeGreaterThan(-1)
  expect(lead).toBeLessThan(html.indexOf(`${T}는 이런 사람`))
  const p = mbtiProfiles[T]
  const sentence = `${p.nickname} ${T}의 연애 궁합 1위는 ${bestMatches(T, 'love', 1)[0]}, 친구 궁합 1위는 ${bestMatches(T, 'friend', 1)[0]}, 직장 궁합 1위는 ${bestMatches(T, 'work', 1)[0]}예요.`
  expect(html).toContain(sentence)
  for (const j of p.jobs.slice(0, 3)) expect(html).toContain(j.title)
  expect(html).toContain(p.travel.domestic[0].place)
  expect(html).toContain(p.travel.abroad[0].place)
  expect(html).toContain(`href="/fortune/mbti?t=${T.toLowerCase()}"`)
})

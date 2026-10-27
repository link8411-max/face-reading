import { renderToStaticMarkup } from 'react-dom/server'
import { CATEGORIES, tabForPath } from '@/content/navigation'
import CategoryList from '@/components/CategoryList'

const cat = (k: string) => CATEGORIES.find((c) => c.key === k)!

test('운세 묶음은 두 갈래: 생년월일로 보는 운세 3개 → MBTI로 보는 운세', () => {
  expect(cat('unse').items.map((i) => [i.group, i.href])).toEqual([
    ['생년월일로 보는 운세', '/fortune'],
    ['생년월일로 보는 운세', '/fortune/2027'],
    ['생년월일로 보는 운세', '/fortune/daily'],
    ['MBTI로 보는 운세', '/fortune/mbti'],
  ])
  const html = renderToStaticMarkup(<CategoryList items={cat('unse').items} />)
  const a = html.indexOf('생년월일로 보는 운세'), b = html.indexOf('MBTI로 보는 운세')
  expect(a).toBeGreaterThanOrEqual(0)
  expect(b).toBeGreaterThan(a)
  expect(html.match(/<h3/g)).toHaveLength(2)
})

test('소제목이 없는 묶음(얼굴)은 그대로', () => {
  expect(renderToStaticMarkup(<CategoryList items={cat('face').items} />)).not.toContain('<h3')
})

test('궁합 묶음에도 오늘의 MBTI 운세, /fortune/mbti는 운세 탭', () => {
  expect(cat('mbti').items.map((i) => i.href)).toContain('/fortune/mbti')
  expect(tabForPath('/fortune/mbti')).toBe('unse')
  expect(tabForPath('/fortune/mbti/r/infp')).toBe('unse')
})

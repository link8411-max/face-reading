import { renderToStaticMarkup } from 'react-dom/server'
import { CATEGORIES, tabForPath } from '@/content/navigation'
import CategoryList from '@/components/CategoryList'

const cat = (k: string) => CATEGORIES.find((c) => c.key === k)!

test('운세 묶음은 세 갈래: 생년월일로 보는 운세 4개 → MBTI로 보는 운세 → 소원을 담은 부적', () => {
  expect(cat('unse').items.map((i) => [i.group, i.href])).toEqual([
    ['생년월일로 보는 운세', '/saju'],
    ['생년월일로 보는 운세', '/fortune'],
    ['생년월일로 보는 운세', '/fortune/2027'],
    ['생년월일로 보는 운세', '/fortune/daily'],
    ['MBTI로 보는 운세', '/fortune/mbti'],
    ['소원을 담은 부적', '/bujeok'],
  ])
  const html = renderToStaticMarkup(<CategoryList items={cat('unse').items} />)
  const a = html.indexOf('생년월일로 보는 운세'), b = html.indexOf('MBTI로 보는 운세')
  expect(a).toBeGreaterThanOrEqual(0)
  expect(b).toBeGreaterThan(a)
  expect(html.match(/<h3/g)).toHaveLength(3)
})

test('관상 묶음은 두 갈래: 관상·동물상 → 삼국지로 보는 얼굴(영상 포함, 일기토 맨 끝)', () => {
  expect(cat('face').items.map((i) => [i.group, i.href])).toEqual([
    ['관상·동물상', '/face2'],
    ['관상·동물상', '/animal'],
    ['삼국지로 보는 얼굴', '/samguk'],
    ['삼국지로 보는 얼굴', '/samguk/team'],
    ['삼국지로 보는 얼굴', '/samguk/cup'],
    ['삼국지로 보는 얼굴', '/samguk/people'],
    ['삼국지로 보는 얼굴', '/samguk/videos'],
    ['삼국지로 보는 얼굴', '/samguk/duel'],
  ])
  expect(renderToStaticMarkup(<CategoryList items={cat('face').items} />).match(/<h3/g)).toHaveLength(2)
})

test('푸터에 나가는 삼국지는 닮은꼴·열전뿐', () => {
  const footer = cat('face').items.filter((i) => i.footer !== false).map((i) => i.href)
  expect(footer).toEqual(['/face2', '/animal', '/samguk', '/samguk/people'])
})

test('오늘의 MBTI 운세는 사주·운세 묶음에만, /fortune/mbti는 운세 탭', () => {
  expect(cat('mbti').items.map((i) => i.href)).toEqual(['/face-match', '/mbti/match', '/mbti'])
  expect(cat('unse').items.map((i) => i.href)).toContain('/fortune/mbti')
  expect(tabForPath('/fortune/mbti')).toBe('all')
  expect(tabForPath('/fortune/mbti/r/infp')).toBe('all')
})

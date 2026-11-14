// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import MbtiArticle, { MBTI_SECTIONS } from '@/components/mbti/MbtiArticle'
import Zodiac2027Article, { ZODIAC_SECTIONS } from '@/components/Zodiac2027Article'
import SectionNav from '@/components/SectionNav'
import { matchNodes } from '@/components/mbti/MbtiMatchMap'
import { MBTI_TYPES, bestMatches } from '@/lib/mbti/compat'
import { ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'

afterEach(cleanup)

test.each(MBTI_TYPES)('/mbti/%s: 단락 탭 항목마다 그 id의 단락이 있고, 탭은 서버 HTML에 있다', (t) => {
  const html = renderToStaticMarkup(<MbtiArticle type={t} />)
  expect(html).toContain('data-section-nav')
  for (const s of MBTI_SECTIONS) {
    expect(html, s.id).toContain(`id="${s.id}"`)
    expect(html).toContain(`href="#${s.id}"`)
  }
})

test.each(ZODIAC_SLUGS)('/fortune/2027/%s: 단락 탭 항목마다 그 id의 단락이 있다', (slug) => {
  const html = renderToStaticMarkup(<Zodiac2027Article slug={slug} />)
  for (const s of ZODIAC_SECTIONS) expect(html, s.id).toContain(`id="${s.id}"`)
})

test('MBTI 궁합 관계도: 연애 1~3위·친구 1위·직장 1위가 둘레에(겹치면 이름표를 합침), 찰떡 1위 카드는 두 캐릭터', () => {
  const nodes = matchNodes('INFP')
  const labels = nodes.flatMap((n) => n.labels)
  expect(labels).toEqual(expect.arrayContaining(['연애 1위', '연애 2위', '연애 3위', '친구 1위', '직장 1위']))
  expect(new Set(nodes.map((n) => n.type)).size).toBe(nodes.length)
  expect(nodes[0].type).toBe(bestMatches('INFP', 'love', 1)[0])
  const html = renderToStaticMarkup(<MbtiArticle type="INFP" />)
  const best = bestMatches('INFP', 'love', 1)[0]
  expect(html).toContain('연애 궁합 1위')
  expect(html).toContain(`/mbti/match?a=INFP&amp;b=${best}`)
  expect(html).toMatch(new RegExp(`/images/mbti/${best.toLowerCase()}-[fm]\\.webp`))
})

test('SectionNav: 누르면 그 단락으로 이동하고 그 탭이 켜진다', () => {
  document.body.innerHTML = ''
  const a = document.createElement('section'); a.id = 'a'; document.body.appendChild(a)
  const b = document.createElement('section'); b.id = 'b'; document.body.appendChild(b)
  const scrollTo = vi.fn()
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  render(<SectionNav items={[{ id: 'a', label: '가' }, { id: 'b', label: '나' }]} />)
  fireEvent.click(screen.getByText('나'))
  expect(scrollTo).toHaveBeenCalled()
  expect(screen.getByText('나').getAttribute('aria-current')).toBe('true')
  expect(screen.getByText('가').getAttribute('aria-current')).toBeNull()
})

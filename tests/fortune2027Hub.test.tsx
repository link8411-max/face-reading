import { renderToStaticMarkup } from 'react-dom/server'
import Zodiac2027Hub from '@/app/fortune/2027/page'
import { SAMJAE_2027, ZODIAC_SLUGS, zodiac2027 } from '@/content/fortune2027Zodiac'
import { hubFaqs, samjaeParagraph } from '@/content/fortune2027Hub'
import { LAST_MODIFIED } from '@/app/sitemap'

test.each(ZODIAC_SLUGS)('%s: 올해관계가 있고 12자 이하', (slug) => {
  const r = zodiac2027[slug].올해관계
  expect(r.length).toBeGreaterThan(0)
  expect(r.length).toBeLessThanOrEqual(12)
})

test('양은 본명년, 말은 오미합', () => {
  expect(zodiac2027.sheep.올해관계).toBe('본명년')
  expect(zodiac2027.horse.올해관계).toBe('오미합')
})

test('삼재띠는 돼지·토끼·양', () => {
  expect(Object.keys(SAMJAE_2027).sort()).toEqual(['pig', 'rabbit', 'sheep'])
})

test('허브: 12띠 표, 삼재 섹션, 관상 CTA, FAQ·빵부스러기 구조화 데이터', () => {
  const html = renderToStaticMarkup(<Zodiac2027Hub />)
  const table = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? ''
  expect(table).toContain('<caption')
  expect(table).toContain('2027 정미년 12띠 한 줄 비교')
  expect(table.match(/<tbody[\s\S]*?<\/tbody>/)?.[0].match(/<tr/g)).toHaveLength(12)
  const start = html.indexOf('2027년 삼재띠는?')
  const end = html.indexOf('href="/face2"')
  expect(start).toBeGreaterThan(-1)
  const sec = html.slice(start, end)
  for (const n of ['돼지띠', '토끼띠', '양띠']) expect(sec).toContain(n)
  for (const s of ['pig', 'rabbit', 'sheep']) expect(sec).toContain(`href="/fortune/2027/${s}"`)
  expect(html).toContain('href="/face2"')
  expect(html).toContain('자주 묻는 질문')
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('')
  expect(ld).toContain('FAQPage')
  expect(ld).toContain('BreadcrumbList')
  expect(html).not.toMatch(/\d+위|\d+\s*점/)
})

test('삼재 문단과 FAQ 내용', () => {
  expect(samjaeParagraph()).toContain('날삼재')
  const faqs = hubFaqs()
  expect(faqs).toHaveLength(3)
  expect(faqs[2].a).toContain('입춘')
})

test('사이트맵 허브 날짜 갱신', () => {
  expect(LAST_MODIFIED['/fortune/2027']).toBe('2026-11-07')
})

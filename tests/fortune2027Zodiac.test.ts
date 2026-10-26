import { zodiac2027, ZODIAC_SLUGS, bodyText, birthYears } from '@/content/fortune2027Zodiac'
import { SITEMAP_ROUTES } from '@/app/sitemap'

test('12띠 슬러그', () => {
  expect(ZODIAC_SLUGS).toEqual(['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig'])
})

test.each(ZODIAC_SLUGS)('%s: 본문 1,500~2,000자(공백 포함), 섹션 구성', (slug) => {
  const z = zodiac2027[slug]
  const len = bodyText(z).length
  expect(len, `${slug} ${len}자`).toBeGreaterThanOrEqual(1500)
  expect(len, `${slug} ${len}자`).toBeLessThanOrEqual(2000)
  for (const k of ['총운', '재물', '연애관계', '직장학업', '건강', '궁합', '조언'] as const) expect(z[k].length, k).toBeGreaterThan(100)
  expect(z.분기).toHaveLength(4)
  expect(Object.keys(z.행운)).toEqual(['색', '숫자', '방위', '아이템'])
})

test('띠끼리 문단이 겹치지 않는다', () => {
  const seen = new Map<string, string>()
  for (const slug of ZODIAC_SLUGS) for (const p of [zodiac2027[slug].총운, zodiac2027[slug].재물, zodiac2027[slug].연애관계, zodiac2027[slug].직장학업, zodiac2027[slug].건강, zodiac2027[slug].조언, ...zodiac2027[slug].분기]) {
    expect(seen.get(p), `${slug}: ${p.slice(0, 20)}`).toBeUndefined()
    seen.set(p, slug)
  }
})

test('출생연도: 1924~2026 중 해당 띠 연도', () => {
  expect(birthYears('rat')).toContain(1984)
  expect(birthYears('sheep')).toEqual(expect.arrayContaining([1931, 1955, 1991, 2015]))
  expect(birthYears('horse')).toContain(2026)
  for (const s of ZODIAC_SLUGS) expect(birthYears(s).every((y) => y >= 1924 && y <= 2026)).toBe(true)
})

test('사이트맵에 허브와 12개 띠 페이지', () => {
  expect(SITEMAP_ROUTES as readonly string[]).toEqual(expect.arrayContaining(['/fortune/2027', ...ZODIAC_SLUGS.map((s) => `/fortune/2027/${s}`)]))
})

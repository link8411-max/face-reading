import { readFileSync } from 'node:fs'
import { DUEL_GENERAL_INTRO } from '@/content/duelGuide'
import { DUEL_GENERALS } from '@/lib/duel/generals'
import { SKILLS } from '@/lib/duel/skills'
import { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap'
import { pageGuides } from '@/content/pageGuides'

const generals = DUEL_GENERALS.filter((g) => g.role !== 'mob')

test('장수 페이지 대상은 12명', () => {
  expect(generals).toHaveLength(12)
  expect(Object.keys(DUEL_GENERAL_INTRO).sort()).toEqual(generals.map((g) => g.id).sort())
})

test.each(generals.map((g) => [g.id, g] as const))('%s 소개는 300자 이상이고 필살기가 SKILLS에 있다', (id, g) => {
  const intro = DUEL_GENERAL_INTRO[id]
  expect(intro.lines.join('').length).toBeGreaterThanOrEqual(300)
  expect(SKILLS[intro.signature]).toBeDefined()
  expect(g.skills).toContain(intro.signature)
})

test('사이트맵에 일기토와 장수 12개 페이지', () => {
  expect(SITEMAP_ROUTES).toContain('/samguk/duel')
  for (const g of generals) {
    const r = `/samguk/duel/generals/${g.id}`
    expect(SITEMAP_ROUTES).toContain(r)
    expect(LAST_MODIFIED[r]).toBe('2026-10-28')
  }
  expect(LAST_MODIFIED['/samguk/duel']).toBe('2026-10-28')
})

test('JSON-LD·안내문은 각 범위에만: samguk layout은 children만, duel layout·장수 페이지에 SoftwareApplication 없음', () => {
  const samguk = readFileSync('src/app/samguk/layout.tsx', 'utf8')
  expect(samguk).not.toContain('PageGuide')
  expect(samguk).not.toContain('ld+json')
  expect(samguk).not.toContain('SoftwareApplication')
  for (const f of ['src/app/samguk/duel/layout.tsx', 'src/app/samguk/duel/generals/[id]/page.tsx', 'src/app/samguk/duel/(game)/layout.tsx']) {
    expect(readFileSync(f, 'utf8'), f).not.toContain('SoftwareApplication')
  }
  expect(readFileSync('src/app/samguk/duel/layout.tsx', 'utf8')).not.toContain('PageGuide')
  expect(readFileSync('src/app/samguk/duel/(game)/layout.tsx', 'utf8')).toContain('<PageGuide route="/samguk/duel" />')
  expect(readFileSync('src/app/samguk/(match)/layout.tsx', 'utf8')).toContain('<PageGuide route="/samguk" />')
})

test('항복 확률을 절반이라고 단정하지 않는다', () => {
  const text = JSON.stringify(DUEL_GENERAL_INTRO) + JSON.stringify(pageGuides['/samguk/duel'])
  expect(text).not.toContain('절반 확률')
  expect(text).not.toContain('절반쯤')
  expect(text).toContain('매력')
})

test('/samguk/duel 가이드: 존재, related에 /samguk, 현재 규칙을 말함', () => {
  const g = pageGuides['/samguk/duel']
  expect(g).toBeDefined()
  expect(g.related).toContain('/samguk')
  expect(pageGuides['/samguk'].related).toContain('/samguk/duel')
  const text = JSON.stringify(g)
  for (const w of ['36', '여포', '맹장', '기장', '지장']) expect(text).toContain(w)
})

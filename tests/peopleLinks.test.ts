import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap'
import { PEOPLE_IDS } from '@/content/samgukPeople'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('열전 사이트맵', () => {
  it('허브·순위·모든 열전 인물이 들어 있다', () => {
    expect(SITEMAP_ROUTES).toContain('/samguk/people')
    expect(SITEMAP_ROUTES).toContain('/samguk/people/ranking')
    for (const id of PEOPLE_IDS) expect(SITEMAP_ROUTES).toContain(`/samguk/people/${id}`)
  })
  it('같은 라우트가 모두 LAST_MODIFIED에 있다', () => {
    for (const r of SITEMAP_ROUTES.filter((x) => x.startsWith('/samguk/people'))) {
      expect(LAST_MODIFIED[r], r).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('열전 연결 소스', () => {
  it('닮은꼴 결과에 열전 링크와 응원 앵커', () => {
    const src = read('src/app/samguk/(match)/page.tsx')
    expect(src).toContain('/samguk/people/')
    expect(src).toContain('#cheer')
    expect(src).toContain('열전 보기')
    expect(src).toContain('내가 닮은 장수 응원하기')
  })
  it('공유 착지에 열전 링크', () => {
    expect(read('src/components/share/SharePage.tsx')).toContain('/samguk/people/')
  })
  it('일기토 장수 페이지에 인물열전 보기', () => {
    expect(read('src/app/samguk/duel/generals/[id]/page.tsx')).toContain('인물열전 보기')
  })
  it('메뉴에 삼국지 인물열전', () => {
    const nav = read('src/content/navigation.ts')
    expect(nav).toContain("href: '/samguk/people'")
    expect(nav).toContain('삼국지 인물열전')
  })
})

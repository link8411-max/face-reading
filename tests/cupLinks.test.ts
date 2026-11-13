import { readFileSync } from 'node:fs'
import { cupBoardFor } from '@/lib/cup/boards'
import { PENDING_PORTRAIT_IDS } from '@/lib/samgukDB'
import { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap'
import { CATEGORIES } from '@/content/navigation'

const read = (f: string) => readFileSync(f, 'utf8')

describe('cupBoardFor: 열전·닮은꼴에서 이어갈 판 고르기', () => {
  test('고정 판 후보는 무장 → 책사 → 여인 순으로 첫 판', () => {
    expect(cupBoardFor('lvbu')).toBe('warrior')
    expect(cupBoardFor('zhugeliang')).toBe('strategist')
    expect(cupBoardFor('diaochan')).toBe('women')
  })
  test('어느 고정 판에도 없는 인물은 전체 무작위', () => {
    expect(cupBoardFor('liushan')).toBe('random')
  })
  test('초상화 대기 인물·모르는 id·프로토타입 키는 null', () => {
    for (const id of PENDING_PORTRAIT_IDS) expect(cupBoardFor(id)).toBeNull()
    expect(cupBoardFor('nobody')).toBeNull()
    expect(cupBoardFor('')).toBeNull()
    expect(cupBoardFor('constructor')).toBeNull()
    expect(cupBoardFor('__proto__')).toBeNull()
  })
})

describe('월드컵 연결', () => {
  test('사이트맵에 월드컵 두 라우트와 날짜', () => {
    for (const r of ['/samguk/cup', '/samguk/cup/ranking']) {
      expect(SITEMAP_ROUTES).toContain(r)
      expect(LAST_MODIFIED[r]).toBe('2026-11-04')
    }
    expect(SITEMAP_ROUTES.some((r) => r.startsWith('/samguk/cup/r/'))).toBe(false)
  })
  test('메뉴: 얼굴 묶음에서 인물열전 바로 앞(개편 1단계 순서)', () => {
    const items = CATEGORIES.find((c) => c.key === 'face')!.items
    const i = items.findIndex((x) => x.href === '/samguk/people')
    expect(items[i - 1]).toMatchObject({ title: '삼국지 장수 월드컵', href: '/samguk/cup', chip: '월드컵' })
  })
  test('열전 페이지·닮은꼴 결과에 월드컵 링크', () => {
    const person = read('src/app/(ko)/samguk/people/[id]/page.tsx')
    expect(person).toContain('이 장수로 월드컵 하기')
    expect(person.indexOf('kind="duel"')).toBeLessThan(person.indexOf('이 장수로 월드컵 하기'))
    expect(person.indexOf('이 장수로 월드컵 하기')).toBeLessThan(person.indexOf('id="scene-vote"'))
    const match = read('src/app/(ko)/samguk/(match)/page.tsx')
    expect(match).toContain('닮은 장수로 월드컵 하기')
    expect(match.indexOf('내가 닮은 장수 응원하기')).toBeLessThan(match.indexOf('닮은 장수로 월드컵 하기'))
  })
  test('개인정보처리방침 6항에 월드컵 선택·우승 결과', () => {
    const src = read('src/app/(ko)/privacy/page.tsx')
    expect(src).toContain('장수 월드컵 선택과 우승 결과')
  })
})

describe('CupWithLink 렌더', () => {
  test('후보면 링크(44px 이상), 초상화 대기·모르는 id면 빈 출력', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: CupWithLink } = await import('@/components/cup/CupWithLink')
    const html = renderToStaticMarkup(CupWithLink({ id: 'lvbu', label: '테스트' }) as never)
    expect(html).toContain('href="/samguk/cup/warrior?with=lvbu"')
    expect(html).toContain('min-h-[44px]')
    expect(CupWithLink({ id: 'nobody', label: '테스트' })).toBeNull()
    expect(CupWithLink({ id: [...PENDING_PORTRAIT_IDS][0], label: '테스트' })).toBeNull()
  })
})

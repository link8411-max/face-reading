import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { fromApi } from '@/lib/videos/parse'
import type { Video } from '@/lib/videos/types'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import { relationsOf } from '@/lib/people/relations'

const fixture = fromApi(JSON.parse(readFileSync(join(__dirname, 'fixtures', 'api-videos.json'), 'utf8')))
let current: Video[] = fixture

vi.mock('@/lib/videos/fetch', () => ({ getChannelVideos: async () => current }))

import Page from '@/app/samguk/people/[id]/page'

async function render(id: string): Promise<string> {
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ id }) }))
}
const idx = (html: string, s: string) => {
  const i = html.indexOf(s)
  expect(i, s).toBeGreaterThanOrEqual(0)
  return i
}

describe('열전 영상 칸', () => {
  beforeEach(() => { current = fixture })

  it('하후돈: 영상 < 쿠팡 < 상관도 < 관계 인물 영상 < 닮은꼴 배너', async () => {
    const html = await render('xiaohoudun')
    const order = [
      idx(html, '하후돈 이야기, 1분 영상'),
      idx(html, 'ads-partners.coupang.com'),
      idx(html, '상관도'),
      idx(html, '관계 인물 영상'),
      idx(html, '사진 한 장으로 확인하기'),
    ]
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('상관도: 둘러싼 N명, 묶음 머리, 조조 칸 링크·재생 표시', async () => {
    const html = await render('xiaohoudun')
    expect(html).toContain('하후돈을 둘러싼')
    expect(html).toContain('혈연 1명')
    const m = html.match(/<a [^>]*href="\/samguk\/people\/caocao"[^>]*>/g) ?? []
    expect(m.some((a) => a.includes('data-has-video'))).toBe(true)
  })

  it('관계 인물 영상 줄에 조조 영상, 본인 영상은 없음', async () => {
    const html = await render('xiaohoudun')
    const row = html.slice(html.indexOf('관계 인물 영상'), html.indexOf('사진 한 장으로 확인하기'))
    expect(row).toContain('NejqojdriBg')
    expect(row).not.toContain('R-lrShfZU7s')
  })

  it('큰 카드: 함께 나오는 인물 칩에 조조 열전, 본인은 없음', async () => {
    const html = await render('xiaohoudun')
    const card = html.slice(html.indexOf('하후돈 이야기, 1분 영상'), html.indexOf('ads-partners.coupang.com'))
    const chips = card.slice(card.indexOf('함께 나오는 인물'))
    expect(chips).toContain('조조 열전')
    expect(chips).not.toContain('하후돈 열전')
    expect(chips).toContain('href="/samguk/people/caocao"')
    expect(card).toContain('/samguk/videos')
  })

  it('VideoObject JSON-LD', async () => {
    expect(await render('xiaohoudun')).toContain('"@type":"VideoObject"')
  })

  it('영상이 없으면 영상 칸만 사라지고 상관도는 그대로', async () => {
    current = []
    const html = await render('xiaohoudun')
    expect(html).not.toContain('1분 영상')
    expect(html).not.toContain('관계 인물 영상')
    expect(html).not.toContain('VideoObject')
    expect(html).not.toContain('data-has-video')
    expect(html).toContain('하후돈을 둘러싼')
    expect(idx(html, '알고 보면 재밌는 이야기')).toBeLessThan(idx(html, 'ads-partners.coupang.com'))
    expect(html.indexOf('ads-partners.coupang.com')).toBeLessThan(html.indexOf('상관도'))
  })

  it('초상화·열전 없는 관계는 점선 칸에 첫 글자, 링크 없음', async () => {
    const html = await render('caocao')
    expect(html).toMatch(/border-dashed[^>]*>[^<]*<span[^>]*>조<\/span>/)
  })

  it('관계가 없는 인물은 상관도·관계 인물 영상을 그리지 않는다', async () => {
    const lone = PEOPLE_IDS.find((id) => relationsOf(id).length === 0)
    // 데이터에 관계 0명인 인물이 없으면 이 단언은 생략한다.
    if (!lone) return
    const html = await render(lone)
    expect(html).not.toContain('을 둘러싼')
    expect(html).not.toContain('관계 인물 영상')
  })
})

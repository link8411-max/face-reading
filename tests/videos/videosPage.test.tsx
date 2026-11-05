import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { fromApi } from '@/lib/videos/parse'
import type { Video } from '@/lib/videos/types'
import { SITEMAP_ROUTES, LAST_MODIFIED } from '@/app/sitemap'

const fixture = fromApi(JSON.parse(readFileSync(join(__dirname, 'fixtures', 'api-videos.json'), 'utf8')))
let current: Video[] = fixture
let currentLong: Video[] = []

vi.mock('@/lib/videos/fetch', () => ({ getChannelVideos: async () => current, getLongVideos: async () => currentLong }))

import Page from '@/app/samguk/videos/page'

async function render(): Promise<string> {
  return renderToStaticMarkup(await Page())
}

describe('/samguk/videos 서버 HTML', () => {
  beforeEach(() => { current = fixture; currentLong = [] })

  it('제목과 테스트 링크', async () => {
    const html = await render()
    expect(html).toContain('쇼츠로 보는 삼국지')
    expect(html).toMatch(/<a [^>]*href="\/samguk"[^>]*>[\s\S]*내 얼굴은 어떤 장수\?/)
  })

  it('카드 3개, 첫 카드는 최신 영상', async () => {
    const html = await render()
    const ids = [...html.matchAll(/data-video-id="([^"]+)"/g)].map((m) => m[1])
    expect(ids).toHaveLength(3)
    expect(ids[0]).toBe('2U3ZFgCdnzU')
  })

  it('인물 칩 전체 3 · 조조 2', async () => {
    const html = await render()
    expect(html).toContain('전체 3')
    expect(html).toContain('조조 2')
  })

  it('ItemList JSON-LD와 쿠팡 videos-hub', async () => {
    const html = await render()
    expect(html).toContain('"@type":"ItemList"')
    expect(html).toContain('videos-hub')
  })

  it('빈 목록: 안내 문구, 카드 0개', async () => {
    current = []
    const html = await render()
    expect(html).toContain('아직 올라온 영상이 없어요')
    expect(html).not.toContain('data-video-id')
  })

  it('롱폼이 없으면 긴 영상 카드 없음', async () => {
    const html = await render()
    expect(html).not.toContain('긴 영상으로 보는 삼국지')
  })

  it('롱폼이 있으면 유튜브 시청 링크와 길이', async () => {
    currentLong = [{ ...fixture[0], id: 'cRxFizceJL8', title: '삼고초려', durationSec: 248, isShort: false }]
    const html = await render()
    expect(html).toContain('긴 영상으로 보는 삼국지')
    expect(html).toContain('href="https://www.youtube.com/watch?v=cRxFizceJL8"')
    expect(html).toContain('4:08')
  })

  it('JSON-LD는 < 를 이스케이프', async () => {
    current = [{ ...fixture[0], title: 'a</script><b>' }]
    const html = await render()
    expect(html).not.toContain('</script><b>')
    expect(html).toContain('\\u003c')
  })
})

test('sitemap에 /samguk/videos', () => {
  expect(SITEMAP_ROUTES).toContain('/samguk/videos')
  expect(LAST_MODIFIED['/samguk/videos']).toBe('2026-11-05')
})

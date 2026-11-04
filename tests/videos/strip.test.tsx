import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { fromApi } from '@/lib/videos/parse'
import type { Video } from '@/lib/videos/types'

const fixture = fromApi(JSON.parse(readFileSync(join(__dirname, 'fixtures', 'api-videos.json'), 'utf8')))
let current: Video[] = fixture

vi.mock('@/lib/videos/fetch', () => ({ getChannelVideos: async () => current }))

import VideoStrip from '@/components/videos/VideoStrip'
import Hub from '@/app/samguk/people/page'

function many(n: number): Video[] {
  return Array.from({ length: n }, (_, i) => ({ ...fixture[0], id: `AAAAAAAAA${String(i).padStart(2, '0')}`, title: `영상 ${i}` }))
}

describe('VideoStrip', () => {
  it('최대 4편, 링크 형식, 전체 보기, no-screenshot', () => {
    const html = renderToStaticMarkup(<VideoStrip videos={many(6)} />)
    expect(html).toContain('쇼츠로 보는 삼국지')
    expect(html.match(/href="\/samguk\/videos\?v=/g)).toHaveLength(4)
    expect(html).toContain('href="/samguk/videos?v=AAAAAAAAA00"')
    expect(html).toMatch(/<a [^>]*href="\/samguk\/videos"[^>]*>[\s\S]*전체 보기/)
    expect(html).toContain('no-screenshot')
    expect(html).toContain('loading="lazy"')
    expect(html).not.toContain('<iframe')
    expect(html).not.toMatch(/<img[^>]*alt="[^"]+"/)
  })

  it('빈 목록이면 아무것도 그리지 않는다', () => {
    expect(renderToStaticMarkup(<VideoStrip videos={[]} />)).toBe('')
  })

  it('열전 허브 HTML에 띠가 있고, 영상이 없으면 빠진다', async () => {
    current = fixture
    expect(renderToStaticMarkup(await Hub())).toContain('쇼츠로 보는 삼국지')
    current = []
    const html = renderToStaticMarkup(await Hub())
    expect(html).not.toContain('쇼츠로 보는 삼국지')
    expect(html).toContain('세력별 관계도')
    current = fixture
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { fromApi } from '@/lib/videos/parse'
import type { Video } from '@/lib/videos/types'
import { relatedFaces } from '@/lib/videos/forPerson'

const fixture = fromApi(JSON.parse(readFileSync(join(__dirname, 'fixtures', 'api-videos.json'), 'utf8')))
let current: Video[] = fixture

vi.mock('@/lib/videos/fetch', () => ({ getChannelVideos: async () => current }))

import { GET } from '@/app/api/samguk/videos/[id]/route'
import ResultVideoBlock from '@/components/videos/ResultVideoBlock'
import { SharePage } from '@/components/share/SharePage'

const call = (id: string) => GET(new Request(`http://x/api/samguk/videos/${id}`), { params: Promise.resolve({ id }) })
const CC = 'public, s-maxage=3600, stale-while-revalidate=86400'

describe('GET /api/samguk/videos/[id]', () => {
  beforeEach(() => { current = fixture })

  it('하후돈: 영상과 엮인 장수, 캐시 헤더', async () => {
    const res = await call('xiaohoudun')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(CC)
    const body = await res.json()
    expect(body.video.id).toBe('R-lrShfZU7s')
    expect(body.faces.length).toBeGreaterThan(0)
    expect(body.faces.length).toBeLessThanOrEqual(5)
  })

  it('영상이 없는 인물은 200 video null', async () => {
    current = []
    const res = await call('xiaohoudun')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.video).toBeNull()
    expect(body.faces.length).toBeGreaterThan(0)
  })

  it('모르는 id는 404', async () => {
    const res = await call('nope')
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe(CC)
    expect(await res.json()).toEqual({ video: null, faces: [] })
  })
})

describe('ResultVideoBlock', () => {
  const faces = relatedFaces('xiaohoudun')
  const video = fixture.find((v) => v.id === 'R-lrShfZU7s')!

  it('루트 no-screenshot, 영상 보기 링크, iframe 없음', () => {
    const html = renderToStaticMarkup(<ResultVideoBlock name="하후돈" personId="xiaohoudun" video={video} faces={faces} />)
    expect(html).toMatch(/^<div class="no-screenshot/)
    expect(html).toContain('/samguk/videos?v=R-lrShfZU7s')
    expect(html).not.toContain('<iframe')
    expect(html).toContain('내 장수 이야기, 1분 영상')
    expect(html).toContain('내 장수와 엮인 장수들')
    expect(html).toContain('/samguk/people/xiaohoudun')
  })

  it('서버 렌더에는 조회수·NEW 라벨이 없다(마운트 뒤 표시, 하이드레이션 안전)', () => {
    const html = renderToStaticMarkup(<ResultVideoBlock name="하후돈" video={{ ...video, views: 1008 }} faces={[]} />)
    expect(html).not.toContain('조회수')
    expect(html).not.toContain('NEW')
    expect(html).not.toContain('#FBF6F1')
  })

  it('영상 없으면 카드 없이 엮인 장수만', () => {
    const html = renderToStaticMarkup(<ResultVideoBlock name="하후돈" personId="xiaohoudun" video={null} faces={faces} />)
    expect(html).not.toContain('1분 영상')
    expect(html).toContain('내 장수와 엮인 장수들')
  })

  it('둘 다 비면 아무것도 그리지 않음', () => {
    expect(renderToStaticMarkup(<ResultVideoBlock name="x" video={null} faces={[]} />)).toBe('')
  })
})

describe('SharePage samguk', () => {
  it('엮인 장수 블록을 서버에서 그린다(친구)', async () => {
    const el = await SharePage({ kind: 'samguk', params: Promise.resolve({ key: 'xiaohoudun' }), searchParams: Promise.resolve({ s: '80' }) })
    const html = renderToStaticMarkup(el)
    expect(html).toContain('친구 장수와 엮인 장수들')
    expect(html).toContain('친구 장수 이야기, 1분 영상')
    expect(html).toContain('no-screenshot')
  })
})

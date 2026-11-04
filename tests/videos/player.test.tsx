import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { fromApi, fromRss } from '@/lib/videos/parse'
import VideoPlayer, { SubscribeLink } from '@/components/videos/VideoPlayer'
import { videoBadge, durationLabel } from '@/lib/videos/format'
import { videoObjectJsonLd, itemListJsonLd } from '@/lib/videos/jsonld'

const api = fromApi(JSON.parse(readFileSync(join(__dirname, 'fixtures', 'api-videos.json'), 'utf8')))
const rss = fromRss(readFileSync(join(__dirname, 'fixtures', 'feed.xml'), 'utf8'))

describe('VideoPlayer', () => {
  it('첫 화면에는 iframe 없이 썸네일과 재생 버튼', () => {
    const html = renderToStaticMarkup(<VideoPlayer video={api[0]} slot="people" />)
    expect(html).not.toContain('<iframe')
    expect(html).toContain('oar2.jpg')
    expect(html).toContain('재생')
    expect(html).toContain('loading="lazy"')
  })
  it('NEW 영상은 NEW만 보인다', () => {
    const now = Date.now()
    const v = { ...api[0], publishedAt: new Date(now - 3600_000).toISOString() }
    const html = renderToStaticMarkup(<VideoPlayer video={v} slot="people" nowMs={now} />)
    expect(html).toContain('NEW')
    expect(html).not.toContain('조회수')
  })
  it('오래된 영상은 조회수', () => {
    const v = { ...api[0], publishedAt: '2020-01-01T00:00:00Z', views: 1008 }
    expect(renderToStaticMarkup(<VideoPlayer video={v} slot="people" nowMs={Date.parse('2026-11-05T00:00:00Z')} />)).toContain('조회수 1,008회')
  })
  it('조회수 띠에 길이가 붙고, NEW에는 안 붙는다', () => {
    const old = { ...api[0], publishedAt: '2020-01-01T00:00:00Z', views: 1008, durationSec: 63 }
    const now = Date.parse('2026-11-05T00:00:00Z')
    expect(renderToStaticMarkup(<VideoPlayer video={old} slot="people" nowMs={now} />)).toContain('조회수 1,008회 · 1:03')
    const fresh = { ...old, publishedAt: new Date(now - 3600_000).toISOString() }
    const html = renderToStaticMarkup(<VideoPlayer video={fresh} slot="people" nowMs={now} />)
    expect(html).toContain('NEW')
    expect(html).not.toContain('1:03')
    expect(renderToStaticMarkup(<VideoPlayer video={{ ...old, durationSec: null }} slot="people" nowMs={now} />)).not.toContain(' · ')
  })
  it('videoBadge: 24시간 안 NEW, 뒤 조회수, 조회수 모르면 null', () => {
    const now = Date.parse('2026-11-05T12:00:00Z')
    const base = { ...api[0], views: 1008 }
    expect(videoBadge({ ...base, publishedAt: '2026-11-05T00:00:00Z' }, now)).toEqual({ kind: 'new' })
    expect(videoBadge({ ...base, publishedAt: '2026-11-03T00:00:00Z' }, now)).toEqual({ kind: 'views', text: '조회수 1,008회' })
    expect(videoBadge({ ...base, publishedAt: '2026-11-03T00:00:00Z', views: null }, now)).toBeNull()
    expect(durationLabel(63)).toBe('1:03')
    expect(durationLabel(null)).toBeNull()
  })
  it('nowMs가 없으면 서버·첫 클라이언트 렌더에 띠가 없다(하이드레이션 일치)', () => {
    const html = renderToStaticMarkup(<VideoPlayer video={{ ...api[0], views: 5 }} slot="people" />)
    expect(html).not.toContain('NEW')
    expect(html).not.toContain('조회수')
  })
  it('잘못된 id는 버튼 없이 썸네일만', () => {
    const v = { ...api[0], id: '"><script>' }
    const html = renderToStaticMarkup(<VideoPlayer video={v} slot="people" />)
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<iframe')
  })
  it('구독 링크', () => {
    const html = renderToStaticMarkup(<SubscribeLink slot="hub" />)
    expect(html).toContain('href="https://www.youtube.com/@unse_ai?sub_confirmation=1"')
    expect(html).toContain('rel="noopener"')
    expect(html).toContain('구독')
  })
})

describe('jsonld', () => {
  it('RSS 영상은 duration 없음', () => {
    expect(videoObjectJsonLd(rss[0])).not.toHaveProperty('duration')
  })
  it('API 영상은 ISO duration과 조회수 통계', () => {
    const v = api.find((x) => x.durationSec === 63)!
    const o = videoObjectJsonLd(v)
    expect(o.duration).toBe('PT1M3S')
    expect(o.contentUrl).toBe(`https://www.youtube.com/shorts/${v.id}`)
    expect(o.embedUrl).toBe(`https://www.youtube-nocookie.com/embed/${v.id}`)
    if (v.views !== null) expect(o.interactionStatistic).toMatchObject({ userInteractionCount: v.views })
  })
  it('views가 없으면 interactionStatistic 없음', () => {
    expect(videoObjectJsonLd({ ...api[0], views: null })).not.toHaveProperty('interactionStatistic')
  })
  it('ItemList는 잘못된 id를 건너뛴다', () => {
    const l = itemListJsonLd([api[0], { ...api[1], id: 'bad' }, api[2]]) as { itemListElement: { position: number }[] }
    expect(l.itemListElement.map((e) => e.position)).toEqual([1, 2])
  })
  it('ItemList', () => {
    const l = itemListJsonLd(api.slice(0, 2)) as { itemListElement: { position: number }[] }
    expect(l.itemListElement.map((e) => e.position)).toEqual([1, 2])
  })
})

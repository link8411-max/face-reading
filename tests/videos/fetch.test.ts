import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getChannelVideos } from '@/lib/videos/fetch'

const dir = join(__dirname, 'fixtures')
const apiItems = JSON.parse(readFileSync(join(dir, 'api-videos.json'), 'utf8')) as any[]
const feed = readFileSync(join(dir, 'feed.xml'), 'utf8')
const ORDER = ['2U3ZFgCdnzU', 'R-lrShfZU7s', 'NejqojdriBg']

const json = (body: unknown, status = 200) =>
  ({ ok: status < 200 || status >= 300 ? false : true, status, json: async () => body, text: async () => JSON.stringify(body) }) as Response
const text = (body: string, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => ({}), text: async () => body }) as Response

type Opts = { playlist?: () => Response; videos?: (items: any[]) => Response; rss?: () => Response; pages?: number }
function mockFetch(o: Opts = {}) {
  const calls: { url: string; init: any }[] = []
  const fn = vi.fn(async (input: any, init?: any) => {
    const url = String(input)
    calls.push({ url, init })
    if (url.includes('/playlistItems')) {
      if (o.playlist) return o.playlist()
      const pages = o.pages ?? 1
      const page = url.includes('pageToken=') ? 2 : 1
      const ids = apiItems.map((i) => i.id)
      const slice = pages === 2 ? (page === 1 ? ids.slice(0, 2) : ids.slice(2)) : ids
      return json({
        items: slice.map((id) => ({ contentDetails: { videoId: id } })),
        ...(pages === 2 && page === 1 ? { nextPageToken: 'TOK' } : {}),
      })
    }
    if (url.includes('/videos?')) {
      const m = /[?&]id=([^&]+)/.exec(url)
      const want = decodeURIComponent(m?.[1] ?? '').split(',')
      const items = apiItems.filter((i) => want.includes(i.id))
      return o.videos ? o.videos(items) : json({ items })
    }
    if (url.includes('feeds/videos.xml')) return o.rss ? o.rss() : text(feed)
    throw new Error('unexpected ' + url)
  })
  vi.stubGlobal('fetch', fn)
  return calls
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getChannelVideos', () => {
  it('키가 있으면 playlistItems → videos 순으로 불러 3편을 돌려준다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'SECRET-KEY')
    const calls = mockFetch()
    const v = await getChannelVideos()
    expect(v.map((x) => x.id)).toEqual(ORDER)
    expect(calls[0].url).toContain('/playlistItems')
    expect(calls[0].url).toContain('playlistId=UUQvI9qIC3pIq_24_x5XE_3g')
    expect(calls[0].url).toContain('maxResults=50')
    expect(calls[1].url).toContain('/videos?')
    expect(calls.every((c) => c.init?.next?.revalidate === 3600)).toBe(true)
    expect(calls.some((c) => c.url.includes('feeds/videos.xml'))).toBe(false)
  })

  it('nextPageToken을 따라 반복한다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'k')
    const calls = mockFetch({ pages: 2 })
    const v = await getChannelVideos()
    expect(v.map((x) => x.id)).toEqual(ORDER)
    expect(calls.filter((c) => c.url.includes('/playlistItems'))).toHaveLength(2)
    expect(calls[1].url).toContain('pageToken=TOK')
  })

  it('id가 50개를 넘으면 50개씩 끊어 videos를 부른다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'k')
    const ids = Array.from({ length: 120 }, (_, i) => `a${String(i).padStart(10, '0')}`)
    const calls = mockFetch({
      playlist: () => json({ items: ids.map((id) => ({ contentDetails: { videoId: id } })) }),
    })
    await getChannelVideos()
    const vc = calls.filter((c) => c.url.includes('/videos?'))
    expect(vc).toHaveLength(3)
    expect(decodeURIComponent(/[?&]id=([^&]+)/.exec(vc[0].url)![1]).split(',')).toHaveLength(50)
    expect(decodeURIComponent(/[?&]id=([^&]+)/.exec(vc[2].url)![1]).split(',')).toHaveLength(20)
  })

  it('키가 없으면 API를 부르지 않고 RSS를 쓴다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', '')
    const calls = mockFetch()
    const v = await getChannelVideos()
    expect(v).toHaveLength(3)
    expect(v.every((x) => x.durationSec === null)).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('feeds/videos.xml?channel_id=UCQvI9qIC3pIq_24_x5XE_3g')
    expect(calls[0].init?.next?.revalidate).toBe(3600)
  })

  it('API가 403이면 RSS로 대신한다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'k')
    mockFetch({ playlist: () => json({ error: 'x' }, 403) })
    const v = await getChannelVideos()
    expect(v).toHaveLength(3)
    expect(v.every((x) => x.durationSec === null)).toBe(true)
  })

  it('API·RSS가 모두 실패해도 []이고 예외를 내보내지 않는다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'k')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('boom') }))
    await expect(getChannelVideos()).resolves.toEqual([])
    mockFetch({ playlist: () => json({}, 500), rss: () => text('x', 500) })
    await expect(getChannelVideos()).resolves.toEqual([])
  })

  it('실패 시 키가 로그에 새지 않는다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'SECRET-KEY')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async (u: any) => { throw new Error('fail ' + String(u)) }))
    await getChannelVideos()
    const logged = JSON.stringify([...spy.mock.calls, ...warn.mock.calls])
    expect(logged).not.toContain('SECRET-KEY')
    spy.mockRestore(); warn.mockRestore()
  })

  it('롱폼은 결과에서 뺀다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'k')
    mockFetch({
      videos: (items) =>
        json({
          items: items.map((i) =>
            i.id === 'NejqojdriBg' ? { ...i, contentDetails: { duration: 'PT10M' } } : i),
        }),
    })
    const v = await getChannelVideos()
    expect(v.map((x) => x.id)).toEqual(['2U3ZFgCdnzU', 'R-lrShfZU7s'])
  })
})

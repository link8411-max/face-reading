// 서버 전용: YOUTUBE_API_KEY를 읽는다. "use client" 파일에서 import하지 말 것.
import { fromApi, fromRss } from './parse'
import type { Video } from './types'

const CHANNEL_ID = 'UCQvI9qIC3pIq_24_x5XE_3g'
const UPLOADS = 'UUQvI9qIC3pIq_24_x5XE_3g'
const API = 'https://www.googleapis.com/youtube/v3'
const RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`
const OPTS = { next: { revalidate: 3600 } } as const
const MAX_PAGES = 20

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, OPTS)
  if (!res.ok) throw new Error(`youtube api ${res.status}`)
  return res.json()
}

// 오류 문구에서 키를 지운다.
function safeMsg(e: unknown, key?: string): string {
  const m = e instanceof Error ? e.message : 'error'
  return key ? m.split(key).join('[redacted]') : m
}

async function viaApi(key: string): Promise<Video[]> {
  const ids: string[] = []
  let token: string | undefined
  for (let i = 0; i < MAX_PAGES; i++) {
    const q = new URLSearchParams({ part: 'contentDetails', playlistId: UPLOADS, maxResults: '50', key })
    if (token) q.set('pageToken', token)
    const data = await getJson(`${API}/playlistItems?${q}`)
    for (const it of data?.items ?? []) {
      const id = it?.contentDetails?.videoId
      if (typeof id === 'string') ids.push(id)
    }
    token = typeof data?.nextPageToken === 'string' ? data.nextPageToken : undefined
    if (!token) break
  }
  const items: unknown[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const q = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: ids.slice(i, i + 50).join(','),
      key,
    })
    const data = await getJson(`${API}/videos?${q}`)
    if (Array.isArray(data?.items)) items.push(...data.items)
  }
  return fromApi(items)
}

async function viaRss(): Promise<Video[]> {
  const res = await fetch(RSS, OPTS)
  if (!res.ok) throw new Error(`youtube rss ${res.status}`)
  return fromRss(await res.text())
}

// 롱폼을 뺀 쇼츠만, 최신순. 어떤 실패도 던지지 않는다.
export async function getChannelVideos(): Promise<Video[]> {
  const key = process.env.YOUTUBE_API_KEY
  let list: Video[] | null = null
  if (key) {
    try {
      list = await viaApi(key)
    } catch (e) {
      console.warn('[videos] api failed:', safeMsg(e, key))
    }
  }
  if (!list) {
    try {
      list = await viaRss()
    } catch (e) {
      console.warn('[videos] rss failed:', safeMsg(e, key))
      return []
    }
  }
  return list.filter((v) => v.isShort)
}

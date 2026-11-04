import { allSamgukCharacters } from '@/lib/samgukDB'
import { VIDEO_OVERRIDES } from '@/content/videoOverrides'
import type { Video, VideoOverride } from './types'

import { isVideoId, thumbUrl } from './format'

export { isVideoId, thumbUrl, gaVideoId, isNew, viewsLabel } from './format'

const NAME_TO_ID = new Map<string, string>(allSamgukCharacters.map((c) => [c.name, c.id]))

export function parseIsoDuration(s: string): number | null {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(s)
  if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

export function stripHashtags(title: string): string {
  const out = title.replace(/(?:^|\s)#\S+/g, '').replace(/\s+/g, ' ').trim()
  return out || title
}

export function peopleFromText(text: string): string[] {
  const ids: string[] = []
  for (const m of text.matchAll(/#([^\s#]+)/g)) {
    const id = NAME_TO_ID.get(m[1])
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

export function applyOverride(v: Video, o?: VideoOverride): Video | null {
  if (!o) return v
  if (o.hide) return null
  return { ...v, people: o.people ?? v.people, event: o.event ?? v.event }
}

function build(
  id: string, rawTitle: string, description: string, publishedAt: string,
  durationSec: number | null, views: number | null,
): Video | null {
  if (!isVideoId(id) || Number.isNaN(Date.parse(publishedAt))) return null
  return applyOverride({
    id,
    title: stripHashtags(rawTitle),
    description,
    publishedAt,
    durationSec,
    views,
    thumbnail: thumbUrl(id),
    people: peopleFromText(`${rawTitle}\n${description}`),
    isShort: durationSec === null || durationSec <= 180,
    event: null,
  }, VIDEO_OVERRIDES[id])
}

const newestFirst = (a: Video, b: Video) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}
const str = (v: unknown) => (typeof v === 'string' ? v : '')

export function fromApi(items: unknown[]): Video[] {
  const out: Video[] = []
  for (const it of items) {
    if (!it || typeof it !== 'object') continue
    const o = it as Record<string, unknown>
    const obj = (k: string) => (typeof o[k] === 'object' && o[k] ? (o[k] as Record<string, unknown>) : {})
    const sn = obj('snippet')
    const v = build(
      str(o.id), str(sn.title), str(sn.description), str(sn.publishedAt),
      parseIsoDuration(str(obj('contentDetails').duration)), num(obj('statistics').viewCount),
    )
    if (v) out.push(v)
  }
  return out.sort(newestFirst)
}

const XML_ENT: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" }
const decode = (s: string) => s.replace(/&(?:amp|lt|gt|quot|apos);/g, (m) => XML_ENT[m])

export function fromRss(xml: string): Video[] {
  const out: Video[] = []
  for (const e of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
    const pick = (re: RegExp) => decode(re.exec(e)?.[1] ?? '')
    const v = build(
      pick(/<yt:videoId>([^<]*)<\/yt:videoId>/),
      pick(/<media:title>([\s\S]*?)<\/media:title>/) || pick(/<title>([\s\S]*?)<\/title>/),
      pick(/<media:description>([\s\S]*?)<\/media:description>/),
      pick(/<published>([^<]*)<\/published>/),
      null,
      num(/<media:statistics[^>]*\sviews="(\d+)"/.exec(e)?.[1]),
    )
    if (v) out.push(v)
  }
  return out.sort(newestFirst)
}

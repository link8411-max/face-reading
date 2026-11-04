import type { Video } from './types'

const ID_RE = /^[A-Za-z0-9_-]{11}$/
const DAY_MS = 24 * 60 * 60 * 1000

export const isVideoId = (s: unknown): s is string => typeof s === 'string' && ID_RE.test(s)
export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/oar2.jpg`
export const gaVideoId = (id: string) => id.replace(/-/g, '_')

export function isNew(publishedAt: string, now: Date): boolean {
  const t = Date.parse(publishedAt)
  return Number.isFinite(t) && now.getTime() - t < DAY_MS
}

export function viewsLabel(v: Video, now: Date): string | null {
  if (isNew(v.publishedAt, now) || v.views === null) return null
  return `조회수 ${v.views.toLocaleString('en-US')}회`
}

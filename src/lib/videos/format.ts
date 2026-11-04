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

export function durationLabel(sec: number | null): string | null {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return null
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

export type VideoBadge = { kind: 'new' } | { kind: 'views'; text: string }

/** 24시간 안이면 NEW만, 그 뒤엔 조회수(조회수를 모르면 null). 배지 규칙은 여기 한 곳. */
export function videoBadge(v: Video, nowMs: number): VideoBadge | null {
  const now = new Date(nowMs)
  if (isNew(v.publishedAt, now)) return { kind: 'new' }
  const text = viewsLabel(v, now)
  return text ? { kind: 'views', text } : null
}

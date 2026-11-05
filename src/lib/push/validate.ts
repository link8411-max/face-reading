import { 육십갑자 } from '@/lib/dailyEngine/relations'

export const ALLOWED_PUSH_HOSTS: readonly string[] = [
  'fcm.googleapis.com',
  '*.push.services.mozilla.com',
  'web.push.apple.com',
  '*.notify.windows.com',
  '*.push.samsungosp.com',
]

export function isAllowedEndpoint(endpoint: string): boolean {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return false
  let u: URL
  try { u = new URL(endpoint) } catch { return false }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return false
  const host = u.hostname.toLowerCase()
  return ALLOWED_PUSH_HOSTS.some((h) => (h.startsWith('*.') ? host.endsWith(h.slice(1)) && host.length > h.length - 1 : host === h))
}

const GANJI = new Set(육십갑자.map((g) => g.천간 + g.지지))
export function isGanji(s: unknown): s is string {
  return typeof s === 'string' && GANJI.has(s)
}

// 알림 시각: 한국 시간 30분 단위 05:00~23:30 (38개)
export const SEND_SLOTS: readonly string[] = Array.from({ length: 38 }, (_, i) => {
  const m = 5 * 60 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 === 0 ? '00' : '30'}`
})
const SLOT_SET = new Set(SEND_SLOTS)
export function isSendAt(s: unknown): s is string {
  return typeof s === 'string' && SLOT_SET.has(s)
}

export interface SubscribeBody { endpoint: string; keys: { p256dh: string; auth: string }; ganji: string; sendAt: string }

const key = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 512

export function parseSubscribeBody(body: unknown): SubscribeBody | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } | null; ganji?: unknown; sendAt?: unknown }
  if (typeof b.endpoint !== 'string' || !isAllowedEndpoint(b.endpoint)) return null
  if (!b.keys || typeof b.keys !== 'object' || !key(b.keys.p256dh) || !key(b.keys.auth)) return null
  if (!isGanji(b.ganji)) return null
  if (b.sendAt !== undefined && !isSendAt(b.sendAt)) return null
  return { endpoint: b.endpoint, keys: { p256dh: b.keys.p256dh, auth: b.keys.auth }, ganji: b.ganji, sendAt: b.sendAt ?? '08:30' }
}

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
  if (u.protocol !== 'https:') return false
  const host = u.hostname.toLowerCase()
  return ALLOWED_PUSH_HOSTS.some((h) => (h.startsWith('*.') ? host.endsWith(h.slice(1)) && host.length > h.length - 1 : host === h))
}

const GANJI = new Set(육십갑자.map((g) => g.천간 + g.지지))
export function isGanji(s: unknown): s is string {
  return typeof s === 'string' && GANJI.has(s)
}

export interface SubscribeBody { endpoint: string; keys: { p256dh: string; auth: string }; ganji: string }

const key = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 512

export function parseSubscribeBody(body: unknown): SubscribeBody | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } | null; ganji?: unknown }
  if (typeof b.endpoint !== 'string' || !isAllowedEndpoint(b.endpoint)) return null
  if (!b.keys || typeof b.keys !== 'object' || !key(b.keys.p256dh) || !key(b.keys.auth)) return null
  if (!isGanji(b.ganji)) return null
  return { endpoint: b.endpoint, keys: { p256dh: b.keys.p256dh, auth: b.keys.auth }, ganji: b.ganji }
}

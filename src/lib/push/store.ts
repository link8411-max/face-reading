// 푸시 구독 저장소(Supabase PostgREST). people/store.ts와 같은 방식: 서비스 키, 5초 제한. endpoint·키는 로그에 남기지 않는다.
import { storeConfig, type StoreConfig } from '@/lib/people/store'

export { storeConfig }
export type { StoreConfig }

export interface SubRow { endpoint: string; p256dh: string; auth: string; ganji: string }

const headers = (cfg: StoreConfig, prefer?: string): Record<string, string> => ({
  apikey: cfg.key,
  Authorization: `Bearer ${cfg.key}`,
  'Content-Type': 'application/json',
  ...(prefer ? { Prefer: prefer } : {}),
})

const T = 'push_subscriptions'

export async function upsertSubscription(cfg: StoreConfig, row: SubRow): Promise<void> {
  const res = await fetch(`${cfg.url}/rest/v1/${T}?on_conflict=endpoint`, {
    method: 'POST',
    headers: headers(cfg, 'resolution=merge-duplicates'),
    body: JSON.stringify({ endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth, ganji: row.ganji }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`upsert ${res.status}`)
}

const quote = (e: string) => `"${e.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
const inList = (eps: string[]) => encodeURIComponent(`(${eps.map(quote).join(',')})`)

export async function deleteSubscription(cfg: StoreConfig, endpoint: string): Promise<void> {
  const res = await fetch(`${cfg.url}/rest/v1/${T}?endpoint=eq.${encodeURIComponent(endpoint)}`, {
    method: 'DELETE',
    headers: headers(cfg),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`delete ${res.status}`)
}

export async function listPending(cfg: StoreConfig, today: string, limit: number): Promise<SubRow[]> {
  const q = `select=endpoint,p256dh,auth,ganji&or=(last_sent_on.is.null,last_sent_on.lt.${today})&order=created_at.asc&limit=${limit}`
  const res = await fetch(`${cfg.url}/rest/v1/${T}?${q}`, { headers: headers(cfg), signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`list ${res.status}`)
  const rows: unknown = await res.json()
  return Array.isArray(rows) ? (rows as SubRow[]) : []
}

export async function markSent(cfg: StoreConfig, endpoints: string[], today: string): Promise<void> {
  for (let i = 0; i < endpoints.length; i += 100) {
    const chunk = endpoints.slice(i, i + 100)
    const res = await fetch(`${cfg.url}/rest/v1/${T}?endpoint=in.${inList(chunk)}`, {
      method: 'PATCH',
      headers: headers(cfg),
      body: JSON.stringify({ last_sent_on: today, fail_count: 0 }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`mark ${res.status}`)
  }
}

export async function bumpFail(cfg: StoreConfig, endpoint: string): Promise<void> {
  const res = await fetch(`${cfg.url}/rest/v1/rpc/push_bump_fail`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ p_endpoint: endpoint }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`bump ${res.status}`)
}

export async function logRun(
  cfg: StoreConfig,
  row: { day: string; sent: number; failed: number; removed: number; ms: number },
): Promise<void> {
  const res = await fetch(`${cfg.url}/rest/v1/push_send_log`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`log ${res.status}`)
}

import webpush from 'web-push'
import { dailyFortune } from '@/lib/dailyEngine'
import { kstDate } from '@/lib/kst'
import type { StoreConfig } from '@/lib/people/store'
import { buildPayload, type PushPayload } from './text'
import type * as Store from './store'
import type { SubRow } from './store'

export type SendResult = 'ok' | 'gone' | 'error'
export type Sender = (sub: SubRow, payload: PushPayload) => Promise<SendResult>

/** web-push 래퍼. 404·410 → 'gone', 그 외 실패 → 'error'. endpoint·키는 로그에 남기지 않는다 */
export function webPushSender(keys: { publicKey: string; privateKey: string; subject: string }): Sender {
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey)
  return async (sub, payload) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 14400, urgency: 'normal' },
      )
      return 'ok'
    } catch (e) {
      const code = (e as { statusCode?: number } | null)?.statusCode
      return code === 404 || code === 410 ? 'gone' : 'error'
    }
  }
}

export interface RunDeps {
  store: Pick<typeof Store, 'listPending' | 'markSent' | 'bumpFail' | 'deleteSubscription' | 'logRun'>
  cfg: StoreConfig
  sender: Sender
  now: () => Date
  budgetMs?: number
  concurrency?: number
  limit?: number
}

export async function runDailySend(deps: RunDeps): Promise<{ day: string; sent: number; failed: number; removed: number; remaining: number }> {
  const { store, cfg, sender, now } = deps
  const budgetMs = deps.budgetMs ?? 45000
  const concurrency = Math.max(1, deps.concurrency ?? 20)
  const limit = deps.limit ?? 1000
  const start = now().getTime()
  const day = kstDate(now())
  const rows = await store.listPending(cfg, day, limit)
  const cache = new Map<string, PushPayload>()
  const payloadFor = (ganji: string) => {
    let p = cache.get(ganji)
    if (!p) {
      p = buildPayload(dailyFortune({ kind: '년주', 천간: ganji[0], 지지: ganji[1] }, now()))
      cache.set(ganji, p)
    }
    return p
  }

  const okEndpoints: string[] = []
  let failed = 0
  let removed = 0
  let processed = 0
  for (let i = 0; i < rows.length; i += concurrency) {
    if (now().getTime() - start > budgetMs) break
    const wave = rows.slice(i, i + concurrency)
    const results = await Promise.all(
      wave.map(async (row) => {
        let r: SendResult
        try { r = await sender(row, payloadFor(row.ganji)) } catch { r = 'error' }
        return r
      }),
    )
    for (let k = 0; k < wave.length; k++) {
      const row = wave[k]
      const r = results[k]
      try {
        if (r === 'ok') okEndpoints.push(row.endpoint)
        else if (r === 'gone') { await store.deleteSubscription(cfg, row.endpoint); removed++ }
        else { await store.bumpFail(cfg, row.endpoint); failed++ }
      } catch {
        if (r !== 'ok') failed++
      }
    }
    processed += wave.length
  }
  if (okEndpoints.length) await store.markSent(cfg, okEndpoints, day)
  const ms = now().getTime() - start
  await store.logRun(cfg, { day, sent: okEndpoints.length, failed, removed, ms }).catch(() => {})
  return { day, sent: okEndpoints.length, failed, removed, remaining: rows.length - processed }
}

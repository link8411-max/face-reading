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
        { TTL: 14400, urgency: 'normal', timeout: 10000 },
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
  const started = now()
  const start = started.getTime()
  const day = kstDate(started)
  const rows = await store.listPending(cfg, day, limit)
  const cache = new Map<string, PushPayload>()
  const payloadFor = (ganji: string) => {
    let p = cache.get(ganji)
    if (!p) {
      p = buildPayload(dailyFortune({ kind: '년주', 천간: ganji[0], 지지: ganji[1] }, started))
      cache.set(ganji, p)
    }
    return p
  }

  let sent = 0
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
    const waveOk: string[] = []
    for (let k = 0; k < wave.length; k++) {
      const row = wave[k]
      const r = results[k]
      try {
        if (r === 'ok') waveOk.push(row.endpoint)
        else if (r === 'gone') { await store.deleteSubscription(cfg, row.endpoint); removed++ }
        else { await store.bumpFail(cfg, row.endpoint, day); failed++ }
      } catch {
        if (r !== 'ok') failed++
      }
    }
    processed += wave.length
    sent += waveOk.length
    if (waveOk.length) {
      // 성공은 묶음마다 기록한다. 한 번 재시도해도 실패하면 진행을 기록할 수 없으니 더 보내지 않는다
      let recorded = false
      for (let attempt = 0; attempt < 2 && !recorded; attempt++) {
        try { await store.markSent(cfg, waveOk, day); recorded = true } catch { /* 재시도 */ }
      }
      if (!recorded) break
    }
  }
  const ms = now().getTime() - start
  await store.logRun(cfg, { day, sent, failed, removed, ms }).catch(() => {})
  return { day, sent, failed, removed, remaining: rows.length - processed }
}

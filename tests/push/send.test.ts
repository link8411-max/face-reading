import { runDailySend, type Sender } from '@/lib/push/send'
function fakeStore(rows: { endpoint: string; ganji: string; last_sent_on?: string | null; fail_count?: number }[]) {
  const db = rows.map((r) => ({ p256dh: 'p', auth: 'a', last_sent_on: null, fail_count: 0, ...r }))
  return { db, store: {
    listPending: async (_c: unknown, today: string, limit: number) => db.filter((r) => !r.last_sent_on || r.last_sent_on < today).slice(0, limit).map(({ endpoint, p256dh, auth, ganji }) => ({ endpoint, p256dh, auth, ganji })),
    markSent: async (_c: unknown, eps: string[], today: string) => { for (const r of db) if (eps.includes(r.endpoint)) { r.last_sent_on = today; r.fail_count = 0 } },
    bumpFail: async (_c: unknown, ep: string) => { const r = db.find((x) => x.endpoint === ep); if (!r) return; r.fail_count++; if (r.fail_count >= 5) db.splice(db.indexOf(r), 1) },
    deleteSubscription: async (_c: unknown, ep: string) => { const i = db.findIndex((x) => x.endpoint === ep); if (i >= 0) db.splice(i, 1) },
    logRun: async () => {},
  } }
}
const cfg = { url: 'x', key: 'y' }
const at = (iso: string) => () => new Date(iso)
test('하루 1회: 같은 날 두 번째 호출은 0건', async () => {
  const f = fakeStore([{ endpoint: 'e1', ganji: '경오' }, { endpoint: 'e2', ganji: '갑자' }])
  const sent: string[] = []; const sender: Sender = async (s) => { sent.push(s.endpoint); return 'ok' }
  const r1 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:30:00Z') })
  expect(r1).toMatchObject({ day: '2026-11-05', sent: 2, failed: 0, removed: 0, remaining: 0 })
  const r2 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:45:00Z') })
  expect(r2.sent).toBe(0); expect(sent).toEqual(['e1', 'e2'])
})
test('410은 삭제, 오류 5번이면 삭제', async () => {
  const f = fakeStore([{ endpoint: 'gone', ganji: '경오' }, { endpoint: 'bad', ganji: '경오', fail_count: 4 }, { endpoint: 'ok', ganji: '경오' }])
  const sender: Sender = async (s) => (s.endpoint === 'gone' ? 'gone' : s.endpoint === 'bad' ? 'error' : 'ok')
  const r = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:30:00Z') })
  expect(r).toMatchObject({ sent: 1, failed: 1, removed: 1 })
  expect(f.db.map((x) => x.endpoint)).toEqual(['ok'])   // gone 삭제, bad는 5회째라 삭제
})
test('KST 자정 직전은 그날, 직후는 다음 날', async () => {
  const f = fakeStore([{ endpoint: 'e', ganji: '경오' }])
  const sender: Sender = async () => 'ok'
  expect((await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T14:59:00Z') })).day).toBe('2026-11-05')
  expect((await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T15:00:00Z') })).day).toBe('2026-11-06')
})
test('시간 예산이 끝나면 멈추고 remaining을 돌려준다', async () => {
  const f = fakeStore(Array.from({ length: 50 }, (_, i) => ({ endpoint: 'e' + i, ganji: '경오' })))
  let t = 0; const sender: Sender = async () => { t += 10; return 'ok' }
  const r = await runDailySend({ store: f.store, cfg, sender, now: () => new Date(Date.UTC(2026, 10, 4, 23, 30, 0) + t), budgetMs: 100, concurrency: 1 })
  expect(r.sent).toBeGreaterThan(0); expect(r.sent).toBeLessThan(50); expect(r.remaining).toBe(50 - r.sent)
})

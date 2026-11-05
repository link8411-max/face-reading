import { kstHHMM } from '@/lib/kst'
import { runDailySend, slotWindow, snapSlot, type Sender } from '@/lib/push/send'
function fakeStore(rows: { endpoint: string; ganji: string; send_at?: string; last_sent_on?: string | null; fail_count?: number; last_fail_on?: string | null }[]) {
  const db = rows.map((r) => ({ p256dh: 'p', auth: 'a', send_at: '08:30', last_sent_on: null, last_fail_on: null as string | null, fail_count: 0, ...r }))
  return { db, store: {
    listPending: async (_c: unknown, today: string, limit: number, w: { from: string; to: string }) => db.filter((r) => (!r.last_sent_on || r.last_sent_on < today) && r.send_at > w.from && r.send_at <= w.to).slice(0, limit).map(({ endpoint, p256dh, auth, ganji, send_at }) => ({ endpoint, p256dh, auth, ganji, send_at })),
    markSent: async (_c: unknown, eps: string[], today: string) => { for (const r of db) if (eps.includes(r.endpoint)) { r.last_sent_on = today; r.fail_count = 0 } },
    bumpFail: async (_c: unknown, ep: string, day: string) => { const r = db.find((x) => x.endpoint === ep); if (!r || r.last_fail_on === day) return; r.last_fail_on = day; r.fail_count++; if (r.fail_count >= 5) db.splice(db.indexOf(r), 1) },
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
test('markSent가 한 번 실패해도 재시도해서 모두 기록한다', async () => {
  const f = fakeStore(Array.from({ length: 5 }, (_, i) => ({ endpoint: 'e' + i, ganji: '경오' })))
  let calls = 0
  const store = { ...f.store, markSent: async (c: unknown, eps: string[], d: string) => { if (calls++ === 0) throw new Error('x'); return f.store.markSent(c, eps, d) } }
  const r = await runDailySend({ store, cfg, sender: async () => 'ok', now: at('2026-11-04T23:30:00Z'), concurrency: 5 })
  expect(r).toMatchObject({ sent: 5, remaining: 0, unrecorded: 0 })
  expect(f.db.every((x) => x.last_sent_on === '2026-11-05')).toBe(true)
})
test('markSent가 계속 실패하면 첫 묶음 뒤 멈춘다', async () => {
  const f = fakeStore(Array.from({ length: 6 }, (_, i) => ({ endpoint: 'e' + i, ganji: '경오' })))
  const sent: string[] = []
  const store = { ...f.store, markSent: async () => { throw new Error('x') } }
  const r = await runDailySend({ store, cfg, sender: async (s) => { sent.push(s.endpoint); return 'ok' }, now: at('2026-11-04T23:30:00Z'), concurrency: 2 })
  expect(r.sent).toBe(2); expect(r.unrecorded).toBe(2); expect(r.remaining).toBe(4); expect(sent.length).toBe(2)
})
test('같은 날 보정 발송이 여러 번 돌아도 실패는 하루 1회만 센다', async () => {
  const f = fakeStore([{ endpoint: 'bad', ganji: '경오' }])
  const sender: Sender = async () => 'error'
  for (const t of ['2026-11-04T23:30:00Z', '2026-11-04T23:45:00Z', '2026-11-05T00:00:00Z']) await runDailySend({ store: f.store, cfg, sender, now: at(t) })
  expect(f.db[0].fail_count).toBe(1)
})
test('kstHHMM·slotWindow', () => {
  expect(kstHHMM(new Date('2026-11-04T23:30:00Z'))).toBe('08:30')
  expect(kstHHMM(new Date('2026-11-04T15:00:00Z'))).toBe('00:00')
  expect(slotWindow('08:30')).toEqual({ from: '07:30', to: '08:30' })
  expect(slotWindow('00:30')).toEqual({ from: '00:00', to: '00:30' })
  expect(slotWindow('00:00')).toEqual({ from: '00:00', to: '00:00' })
})
test('snapSlot: 30분 경계, +5분 허용', () => {
  for (const [a, b] of [['08:29', '08:30'], ['08:31', '08:30'], ['08:44', '08:30'], ['08:55', '09:00'], ['08:00', '08:00'], ['23:58', '00:00']]) expect(snapSlot(a)).toBe(b)
})
test('슬롯 창: 08:30 구독자는 08:30·09:00 회차에만, 09:30엔 제외; 자정 회차는 어제 23:30을 안 줍는다', async () => {
  const f = fakeStore([
    { endpoint: 'a', ganji: '경오', send_at: '08:30' },
    { endpoint: 'b', ganji: '경오', send_at: '09:00' },
    { endpoint: 'c', ganji: '경오', send_at: '23:30', last_sent_on: '2026-11-04' },
  ])
  const sent: string[] = []; const sender: Sender = async (s) => { sent.push(s.endpoint); return 'ok' }
  const r1 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-04T23:30:00Z') })   // 08:30 KST
  expect(r1.window).toEqual({ from: '07:30', to: '08:30' }); expect(sent).toEqual(['a'])
  const r2 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T00:00:00Z') })   // 09:00 KST
  expect(sent).toEqual(['a', 'b']); expect(r2.sent).toBe(1)
  const r3 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T00:30:00Z') })   // 09:30 KST
  expect(r3.sent).toBe(0)
  const r4 = await runDailySend({ store: f.store, cfg, sender, now: at('2026-11-05T15:00:00Z') })   // 다음 날 00:00 KST
  expect(r4.window).toEqual({ from: '00:00', to: '00:00' }); expect(r4.sent).toBe(0); expect(sent).toEqual(['a', 'b'])
})

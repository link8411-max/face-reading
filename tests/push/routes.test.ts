import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { POST, DELETE } from '@/app/api/push/subscribe/route'
import { POST as SEND } from '@/app/api/push/send/route'
import { pushGuard } from '@/lib/push/guard'

const URL_ = 'https://unse-ai.com/api/push/subscribe'
const EP = 'https://fcm.googleapis.com/fcm/send/abc'
const good = { endpoint: EP, keys: { p256dh: 'p', auth: 'a' }, ganji: '갑자' }
const req = (method: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(URL_, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://unse-ai.com', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

beforeEach(() => {
  pushGuard.reset()
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'k')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

test('subscribe: 415/403/413/400/503/200', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }))
  expect((await POST(req('POST', good, { 'content-type': 'text/plain' }))).status).toBe(415)
  expect((await POST(req('POST', good, { origin: 'https://evil.com' }))).status).toBe(403)
  expect((await POST(req('POST', 'x'.repeat(3000)))).status).toBe(413)
  expect((await POST(req('POST', '{bad'))).status).toBe(400)
  expect((await POST(req('POST', { ...good, ganji: 'zz' }))).status).toBe(400)
  expect(f).not.toHaveBeenCalled()
  const ok = await POST(req('POST', good))
  expect(ok.status).toBe(200)
  expect(await ok.json()).toEqual({ ok: true })
  vi.stubEnv('SUPABASE_URL', '')
  expect((await POST(req('POST', good))).status).toBe(503)
})

test('subscribe: 429 after limit', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }))
  let last = 0
  for (let i = 0; i < 31; i++) last = (await POST(req('POST', good))).status
  expect(last).toBe(429)
})

test('subscribe upsert 본문에 last_sent_on이 없다', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }))
  await POST(req('POST', good))
  const body = String((f.mock.calls[0][1] as RequestInit).body)
  expect(body).not.toContain('last_sent_on')
  expect(body).toContain(EP)
})

test('subscribe: sendAt 검증과 기본값', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 201 }))
  expect((await POST(req('POST', { ...good, sendAt: '08:15' }))).status).toBe(400)
  expect(f).not.toHaveBeenCalled()
  await POST(req('POST', good))
  expect(String((f.mock.calls[0][1] as RequestInit).body)).toContain('"send_at":"08:30"')
  await POST(req('POST', { ...good, sendAt: '21:00' }))
  expect(String((f.mock.calls[1][1] as RequestInit).body)).toContain('"send_at":"21:00"')
})

test('delete: 400 for bad endpoint, 200 otherwise', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
  expect((await DELETE(req('DELETE', { endpoint: 'https://evil.com/x' }))).status).toBe(400)
  expect((await DELETE(req('DELETE', {}, { 'content-type': 'text/plain' }))).status).toBe(415)
  const ok = await DELETE(req('DELETE', { endpoint: EP }))
  expect(ok.status).toBe(200)
  expect(await ok.json()).toEqual({ ok: true })
  expect((f.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
})

const send = (auth?: string) =>
  SEND(new Request('https://unse-ai.com/api/push/send', { method: 'POST', headers: auth ? { authorization: auth } : {} }))

test('send: 비밀 없거나 틀리면 401, 키 없으면 503', async () => {
  expect((await send('Bearer s3cret')).status).toBe(401) // 비밀 미설정
  vi.stubEnv('PUSH_CRON_SECRET', 's3cret')
  expect((await send()).status).toBe(401)
  expect((await send('Bearer wrong')).status).toBe(401)
  expect((await send('Bearer s3cret-longer')).status).toBe(401)
  const r = await send('Bearer s3cret') // VAPID 없음
  expect(r.status).toBe(503)
  expect(await r.json()).toEqual({ ok: false, reason: 'disabled' })
})

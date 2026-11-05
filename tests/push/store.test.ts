import { afterEach, expect, test, vi } from 'vitest'
import { listPending } from '@/lib/push/store'

afterEach(() => vi.unstubAllGlobals())

test('listPending: 슬롯 창과 미발송 조건이 쿼리에 들어간다', async () => {
  const f = vi.fn(async () => new Response('[]', { status: 200 }))
  vi.stubGlobal('fetch', f)
  await listPending({ url: 'https://x.supabase.co', key: 'k' }, '2026-11-05', 1000, { from: '07:30', to: '08:30' })
  const url = decodeURIComponent(String((f.mock.calls[0] as unknown[])[0]))
  expect(url).toContain('send_at=gt.07:30')
  expect(url).toContain('send_at=lte.08:30')
  expect(url).toContain('or=(last_sent_on.is.null,last_sent_on.lt.2026-11-05)')
  expect(String((f.mock.calls[0] as unknown[])[0])).toContain('send_at=gt.07%3A30')
})

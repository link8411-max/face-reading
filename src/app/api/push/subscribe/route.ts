import { NextResponse } from 'next/server'
import { clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard'
import { sameSite } from '@/lib/people/voter'
import { pushGuard } from '@/lib/push/guard'
import { deleteSubscription, storeConfig, upsertSubscription } from '@/lib/push/store'
import { isAllowedEndpoint, parseSubscribeBody } from '@/lib/push/validate'

const fail = (status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ ok: false, ...extra }, { status })

// 본문은 로그에 남기지 않는다. 검증 통과한 JSON을 돌려주거나, 실패 응답을 돌려준다
async function readJson(request: Request, ip: string): Promise<{ body: unknown } | { res: NextResponse }> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') return { res: fail(415) }
  if (!sameSite(request)) return { res: fail(403) }
  if (!pushGuard.allowRequest(ip)) return { res: fail(429) }
  const text = await readLimitedBody(request)
  if (text === null) return { res: fail(413) }
  try {
    return { body: JSON.parse(text) }
  } catch {
    return { res: fail(400) }
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  const r = await readJson(request, ip)
  if ('res' in r) return r.res
  const sub = parseSubscribeBody(r.body)
  if (!sub) return fail(400)
  const cfg = storeConfig()
  if (!cfg) {
    pushGuard.refundRequest(ip)
    return fail(503, { reason: 'disabled' })
  }
  try {
    await upsertSubscription(cfg, { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, ganji: sub.ganji, send_at: sub.sendAt })
  } catch {
    return fail(502)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const ip = clientIp(request.headers)
  const r = await readJson(request, ip)
  if ('res' in r) return r.res
  const endpoint = (r.body as { endpoint?: unknown } | null)?.endpoint
  if (typeof endpoint !== 'string' || !isAllowedEndpoint(endpoint)) return fail(400)
  const cfg = storeConfig()
  if (!cfg) {
    pushGuard.refundRequest(ip)
    return fail(503, { reason: 'disabled' })
  }
  try {
    await deleteSubscription(cfg, endpoint)
  } catch {
    return fail(502)
  }
  return NextResponse.json({ ok: true })
}

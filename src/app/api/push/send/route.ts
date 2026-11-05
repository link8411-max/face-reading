import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { runDailySend, webPushSender } from '@/lib/push/send'
import { kstDate } from '@/lib/kst'
import * as store from '@/lib/push/store'

export const runtime = 'nodejs'
export const maxDuration = 60

function authorized(request: Request): boolean {
  const secret = process.env.PUSH_CRON_SECRET
  if (!secret) return false
  const got = Buffer.from(request.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export async function POST(request: Request) {
  const t0 = Date.now()
  if (!authorized(request)) {
    console.error('[push] send failed: unauthorized')
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const cfg = store.storeConfig()
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!cfg || !publicKey || !privateKey || !subject) {
    console.error('[push] send failed: disabled')
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })
  }
  try {
    const result = await runDailySend({
      store,
      cfg,
      sender: webPushSender({ publicKey, privateKey, subject }),
      now: () => new Date(),
    })
    console.log(`[push] day=${result.day} sent=${result.sent} failed=${result.failed} removed=${result.removed} remaining=${result.remaining} unrecorded=${result.unrecorded}`)
    return NextResponse.json({ ok: true, ...result })
  } catch {
    console.error('[push] send failed: error')
    try {
      await store.logRun(cfg, { day: kstDate(new Date()), sent: 0, failed: 0, removed: 0, ms: Date.now() - t0 })
    } catch { /* 기록 실패는 무시 */ }
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

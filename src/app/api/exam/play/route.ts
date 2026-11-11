import { NextResponse } from 'next/server'
import { clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard'
import { kstDate } from '@/lib/kst'
import { storeConfig } from '@/lib/people/store'
import { sameSite } from '@/lib/people/voter'
import { validatePlay } from '@/lib/exam/stats'
import { insertPlay, resolveDevice } from '@/lib/exam/statsStore'
import { examGuard, maxRoundNow } from '@/lib/exam/serverRound'

// Supabase가 서울에 있어 함수도 서울에서 돌린다
export const preferredRegion = 'icn1'

// 한 판이 끝나면 기기가 한 번 보낸다: { round, marks: 'OXOOX', score, grade }. 실패해도 화면은 상관없다.
export async function POST(request: Request) {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') return NextResponse.json({ ok: false }, { status: 415 })
  if (!sameSite(request)) return NextResponse.json({ ok: false }, { status: 403 })

  // IP는 속도 제한에만 쓰고 저장·로그·전송하지 않는다
  const ip = clientIp(request.headers)
  if (!examGuard.allowRequest(ip)) return NextResponse.json({ ok: false }, { status: 429 })

  const text = await readLimitedBody(request)
  if (text === null) return NextResponse.json({ ok: false }, { status: 413 })
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const now = new Date()
  const play = validatePlay(body, maxRoundNow(now))
  if (!play) return NextResponse.json({ ok: false }, { status: 400 })

  const cfg = storeConfig()
  if (!cfg) {
    examGuard.refundRequest(ip)
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })
  }

  const secret = process.env.PEOPLE_VOTE_SECRET || cfg.key
  const day = kstDate(now)
  let device: Awaited<ReturnType<typeof resolveDevice>>
  try {
    device = await resolveDevice(request, secret, day.replace(/-/g, ''))
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }
  const respond = (data: unknown, status = 200) => {
    const res = NextResponse.json(data, { status })
    if (device.setCookie) res.headers.append('Set-Cookie', device.setCookie)
    return res
  }
  try {
    const { counted } = await insertPlay(cfg, play, device.deviceHash, day)
    return respond({ ok: true, counted })
  } catch {
    return respond({ ok: false }, 502)
  }
}

import { NextResponse } from 'next/server'
import { clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard'
import { insertVote, readStatsWithRank, storeConfig } from '@/lib/people/store'
import { kstDay, pvUuidFor, signPvCookie, statsOwner, validateVote, verifyPvCookie, voteGuard, voterHash } from '@/lib/people/votes'

const COOKIE = 'pv'

function readPvCookie(request: Request): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return rest.join('=')
  }
  return null
}

const ALLOWED_HOSTS = new Set(['unse-ai.com', 'www.unse-ai.com', 'localhost'])

// Origin 헤더가 있으면(브라우저의 교차 출처 요청 포함) 우리 사이트에서 온 것만 받는다.
function sameSite(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (origin === null) return true
  let host: string
  let hostname: string
  try {
    const u = new URL(origin)
    host = u.host
    hostname = u.hostname
  } catch {
    return false
  }
  const own = request.headers.get('host') ?? new URL(request.url).host
  return host === own || ALLOWED_HOSTS.has(hostname)
}

export async function POST(request: Request) {
  // 다른 사이트의 폼·no-cors 요청은 본문을 읽기 전에 막는다
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') return NextResponse.json({ ok: false }, { status: 415 })
  if (!sameSite(request)) return NextResponse.json({ ok: false }, { status: 403 })

  // IP는 속도 제한과 해시 계산에만 쓰고 저장·로그·전송하지 않는다
  const ip = clientIp(request.headers)
  if (!voteGuard.allowRequest(ip)) return NextResponse.json({ ok: false }, { status: 429 })

  const text = await readLimitedBody(request)
  if (text === null) return NextResponse.json({ ok: false }, { status: 413 })

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const vote = validateVote(body)
  if (!vote) return NextResponse.json({ ok: false }, { status: 400 })
  // 집계를 보여 줄 인물(page). 대결은 page가 필수라 맞지 않으면 저장 전에 400
  const owner = statsOwner(vote, (body as { page?: unknown }).page)
  if (!owner) return NextResponse.json({ ok: false }, { status: 400 })

  // 설정이 없으면 기록만 꺼진다. 꺼진 상태의 요청은 한도에서 돌려준다.
  const cfg = storeConfig()
  if (!cfg) {
    voteGuard.refundRequest(ip)
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })
  }

  // 빈 문자열도 없는 것으로 본다(빈 키는 HMAC 키로 쓸 수 없다)
  const secret = process.env.PEOPLE_VOTE_SECRET || cfg.key
  const day = kstDay(new Date())
  const today = day.replace(/-/g, '')

  // pv 쿠키는 서버가 서명한 `<uuid>.<발급일>.<서명>`만 받는다. 형식·서명이 틀리면 쿠키가 없는 것으로 본다.
  // 아무 UUID나 받으면 요청마다 새 UUID를 보내 표를 계속 늘릴 수 있다.
  const raw = readPvCookie(request)
  const valid = raw === null ? null : await verifyPvCookie(secret, raw)
  // 발급일 다음 날부터만 쿠키의 uuid로 해시한다. 유효한 쿠키가 없거나 발급일이 오늘이면 고정값('new')이라
  // 쿠키를 새로 받아 곧바로 쓰는 스크립트도 IP·대상마다 하루 한 표가 상한이다.
  const deviceId = valid && valid.issuedDay < today ? valid.uuid : 'new'
  // 유효한 쿠키가 없을 때만 새 쿠키를 내려 준다. uuid는 IP·날짜별 고정값이라 같은 IP는 하루에 쿠키를 하나만 받는다
  const issued = valid ? null : await signPvCookie(secret, await pvUuidFor(secret, ip, today), today)

  // 새로 만든 쿠키는 어떤 응답에도 실어 보낸다. 집계 읽기가 실패해 다시 눌러도 같은 해시가 되어 응원이 두 번 세어지지 않는다.
  const respond = (data: unknown, status = 200) => {
    const res = NextResponse.json(data, { status })
    if (issued) {
      res.headers.append(
        'Set-Cookie',
        `${COOKIE}=${issued}; HttpOnly; SameSite=Lax; Path=/api/people; Max-Age=31536000; Secure`,
      )
    }
    return res
  }

  let counted: boolean
  try {
    const voter_hash = await voterHash(secret, day, deviceId, ip)
    counted = (await insertVote(cfg, { ...vote, voter_hash, day })).counted
  } catch {
    return respond({ ok: false }, 502)
  }
  // 저장은 됐으니 집계 읽기 실패는 치명적이지 않다(stats: null → 화면은 숫자를 숨긴다)
  let stats = null
  try {
    stats = await readStatsWithRank(cfg, owner)
  } catch {
    stats = null
  }
  return respond({ ok: true, counted, stats })
}

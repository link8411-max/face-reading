import { NextResponse } from 'next/server'
import { getPerson } from '@/content/samgukPeople'
import { clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard'
import { insertVote, readStats, storeConfig } from '@/lib/people/store'
import { kstDay, pairKey, validateVote, voteGuard, voterHash } from '@/lib/people/votes'

const COOKIE = 'pv'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readDeviceId(request: Request): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) {
      const v = rest.join('=')
      return UUID.test(v) ? v : null
    }
  }
  return null
}

export async function POST(request: Request) {
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

  // 설정이 없으면 기록만 꺼진다. 꺼진 상태의 요청은 한도에서 돌려준다.
  const cfg = storeConfig()
  if (!cfg) {
    voteGuard.refundRequest(ip)
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })
  }

  const existing = readDeviceId(request)
  const deviceId = existing ?? crypto.randomUUID()
  const secret = process.env.PEOPLE_VOTE_SECRET ?? cfg.key
  const day = kstDay(new Date())

  try {
    const voter_hash = await voterHash(secret, day, deviceId, ip)
    const { counted } = await insertVote(cfg, { ...vote, voter_hash, day })
    const stats = await readStats(cfg, vote.kind === 'duel' ? duelOwner(vote.target) : vote.target)
    const res = NextResponse.json({ ok: true, counted, stats })
    if (!existing) {
      res.headers.append(
        'Set-Cookie',
        `${COOKIE}=${deviceId}; HttpOnly; SameSite=Lax; Path=/api/people; Max-Age=31536000; Secure`,
      )
    }
    return res
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }
}

// 대결 투표 뒤 보여 줄 집계의 주인공: 쌍 키의 두 id 중 그 쌍을 라이벌로 가진 열전 인물
function duelOwner(target: string): string {
  const [a, b] = target.split('__')
  const p = getPerson(a)
  return p && pairKey(a, p.rivalId) === target ? a : b
}

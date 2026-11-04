import { NextResponse } from 'next/server'
import { clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard'
import { insertVote, readStatsWithRank, storeConfig } from '@/lib/people/store'
import { resolveVoter, sameSite } from '@/lib/people/voter'
import { statsOwner, validateVote, voteGuard } from '@/lib/people/votes'

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
  let voter: Awaited<ReturnType<typeof resolveVoter>>
  try {
    voter = await resolveVoter(request, secret, ip, new Date())
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }

  // 새로 만든 쿠키는 어떤 응답에도 실어 보낸다. 집계 읽기가 실패해 다시 눌러도 같은 해시가 되어 응원이 두 번 세어지지 않는다.
  const respond = (data: unknown, status = 200) => {
    const res = NextResponse.json(data, { status })
    if (voter.setCookie) res.headers.append('Set-Cookie', voter.setCookie)
    return res
  }

  let counted: boolean
  try {
    counted = (await insertVote(cfg, { ...vote, voter_hash: voter.voterHash, day: voter.day })).counted
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

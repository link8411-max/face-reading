import { NextResponse } from 'next/server'
import { cupGuard, cupRow, validateCupVote } from '@/lib/cup/votes'
import { clientIp, readLimitedBody } from '@/lib/duel/feedbackGuard'
import { insertVote, readCupPair, storeConfig } from '@/lib/people/store'
import { resolveVoter, sameSite } from '@/lib/people/voter'

// Supabase가 서울(ap-northeast-2)에 있어 함수도 서울에서 돌린다(미국 동부면 요청마다 태평양 왕복 2번)
export const preferredRegion = 'icn1'

// 열전 투표(/api/people/vote)와 같은 규칙: 쿠키 Path가 /api/people이라 같은 pv 쿠키를 받는다.
export async function POST(request: Request) {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') return NextResponse.json({ ok: false }, { status: 415 })
  if (!sameSite(request)) return NextResponse.json({ ok: false }, { status: 403 })

  // IP는 속도 제한과 해시 계산에만 쓰고 저장·로그·전송하지 않는다
  const ip = clientIp(request.headers)
  if (!cupGuard.allowRequest(ip)) return NextResponse.json({ ok: false }, { status: 429 })

  const text = await readLimitedBody(request)
  if (text === null) return NextResponse.json({ ok: false }, { status: 413 })

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const vote = validateCupVote(body)
  if (!vote) return NextResponse.json({ ok: false }, { status: 400 })

  const cfg = storeConfig()
  if (!cfg) {
    cupGuard.refundRequest(ip)
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })
  }

  const secret = process.env.PEOPLE_VOTE_SECRET || cfg.key
  let voter: Awaited<ReturnType<typeof resolveVoter>>
  try {
    voter = await resolveVoter(request, secret, ip, new Date())
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }
  const respond = (data: unknown, status = 200) => {
    const res = NextResponse.json(data, { status })
    if (voter.setCookie) res.headers.append('Set-Cookie', voter.setCookie)
    return res
  }

  const row = cupRow(vote)
  try {
    await insertVote(cfg, { ...row, voter_hash: voter.voterHash, day: voter.day })
  } catch {
    return respond({ ok: false }, 502)
  }
  if (vote.type === 'win') return respond({ ok: true })

  // 저장은 됐으니 집계 읽기 실패는 치명적이지 않다(others: null → 화면은 숫자를 숨긴다)
  let others: Record<string, number> | null = null
  try {
    const stats = await readCupPair(cfg, row.target)
    // 두 장수 표만 돌려준다(RPC가 다른 키를 줘도 무시, 없으면 0). 방금 저장한 내 표 1개는 뺀다(0 아래로 내려가지 않게)
    const own = (id: string) => Math.max(0, (stats[id] ?? 0) - (id === vote.pick ? 1 : 0))
    others = { [vote.a]: own(vote.a), [vote.b]: own(vote.b) }
  } catch {
    others = null
  }
  return respond({ ok: true, counted: true, others })
}

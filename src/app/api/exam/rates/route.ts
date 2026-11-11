import { NextResponse } from 'next/server'
import { storeConfig } from '@/lib/people/store'
import { parseRound } from '@/lib/exam/stats'
import { readRates } from '@/lib/exam/statsStore'
import { maxRoundNow } from '@/lib/exam/serverRound'

export const preferredRegion = 'icn1'

// 한 회차의 문제별 응시 수·정답 수. 판을 시작할 때 한 번 읽는다(CDN에 1분 캐시).
// 숫자를 보여 줄지(표본 기준)는 화면이 정한다(rateText).
export async function GET(request: Request) {
  const round = parseRound(new URL(request.url).searchParams.get('round'), maxRoundNow(new Date()))
  if (round === null) return NextResponse.json({ ok: false }, { status: 400 })

  const cfg = storeConfig()
  if (!cfg) return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })

  try {
    const rates = await readRates(cfg, round)
    return NextResponse.json(
      { ok: true, round, rates },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } },
    )
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }
}

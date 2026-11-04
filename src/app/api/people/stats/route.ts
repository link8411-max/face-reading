import { NextResponse } from 'next/server'
import { getPerson } from '@/content/samgukPeople'
import { readStatsWithRank, storeConfig } from '@/lib/people/store'

// Supabase가 서울(ap-northeast-2)에 있어 함수도 서울에서 돌린다(미국 동부면 요청마다 태평양 왕복 2번)
export const preferredRegion = 'icn1'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !getPerson(id)) return NextResponse.json({ ok: false }, { status: 400 })

  const cfg = storeConfig()
  if (!cfg) return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })

  try {
    const stats = await readStatsWithRank(cfg, id)
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }
}

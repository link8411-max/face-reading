import { NextResponse } from 'next/server'
import { getPerson } from '@/content/samgukPeople'
import { readStats, storeConfig } from '@/lib/people/store'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !getPerson(id)) return NextResponse.json({ ok: false }, { status: 400 })

  const cfg = storeConfig()
  if (!cfg) return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 503 })

  try {
    const stats = await readStats(cfg, id)
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 })
  }
}

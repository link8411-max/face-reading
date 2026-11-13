'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'
import Link from 'next/link'
import { LIMITED_TEXT, useMarker, usePersonStats, writeMarker } from './usePersonStats'

type Done = 'counted' | 'already' | 'thanks'

const LABEL: Record<Done, string> = {
  counted: '오늘 응원했어요',
  already: '오늘 응원이 반영됐어요',
  thanks: '고마워요',
}

export default function CheerButton({ id, name }: { id: string; name: string }) {
  const { stats, vote } = usePersonStats(id)
  const marker = useMarker('cheer', id)
  const [local, setDone] = useState<Done | null>(null)
  const done: Done | null = local ?? (marker !== null ? 'counted' : null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [limited, setLimited] = useState(false)

  async function onClick() {
    if (busy || done) return
    setBusy(true)
    setFailed(false)
    setLimited(false)
    track('people_cheer', { result_id: id })
    const r = await vote('cheer', id, 'cheer')
    setBusy(false)
    if (r === 'limited') {
      setLimited(true)
    } else if (r) {
      writeMarker('cheer', id, 'cheer')
      setDone(r.counted ? 'counted' : 'already')
    } else if (!navigator.onLine) {
      setFailed(true)
    } else {
      // 기록이 꺼져 있거나 일시 오류: 조용히 고마움만 전한다
      setDone('thanks')
    }
  }

  return (
    <div className="rounded-[22px] bg-card border border-line px-5 py-5 text-center">
      <h2 className="font-serif font-bold text-lg break-keep">{name}에게 힘을 보태 주세요</h2>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || done !== null}
        aria-live="polite"
        className="mt-3 h-[52px] w-full rounded-full bg-accent text-white font-medium px-4 disabled:opacity-70"
      >
        {done ? LABEL[done] : '응원하기'}
      </button>
      {stats && (
        <div className="mt-2 text-sm text-muted">
          <p data-cheer-count>{stats.cheer > 0 ? `응원 ${stats.cheer.toLocaleString('ko-KR')}번` : '첫 응원을 남겨 보세요'}</p>
          {stats.cheer > 0 && typeof stats.rank === 'number' && (
            <p data-cheer-rank className="mt-0.5">
              지금 응원 순위 {stats.rank}위
            </p>
          )}
        </div>
      )}
      {limited && <p className="mt-2 text-sm text-muted">{LIMITED_TEXT}</p>}
      {failed && <p className="mt-2 text-sm text-muted">연결을 확인하고 다시 눌러 주세요</p>}
      <p className="mt-3 text-xs">
        <Link href="/samguk/people/ranking" prefetch={false} className="underline text-muted">
          응원 순위 보기
        </Link>
      </p>
    </div>
  )
}

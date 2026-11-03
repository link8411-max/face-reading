'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { PersonStats, VoteKind } from '@/lib/people/votes'
import { kstDay } from '@/lib/people/keys'

/** 투표가 적어 비율을 숨길 때, 실제 참여 수만 알려 준다 */
export const headCountText = (n: number) => `지금 ${n.toLocaleString('ko-KR')}명이 투표했어요`
export const LIMITED_TEXT = '잠시 후 다시 눌러 주세요'

/** 집계 합이 threshold 미만이면 비율을 숨긴다. 보이면 합이 정확히 100이 되도록 반올림(최대 잉여법) */
export function ratioView(counts: Record<string, number>, threshold = 10): { show: boolean; pct: Record<string, number> } {
  const keys = Object.keys(counts)
  const total = keys.reduce((s, k) => s + counts[k], 0)
  if (total < threshold || total <= 0) return { show: false, pct: {} }
  const raw = keys.map((k) => ({ k, exact: (counts[k] / total) * 100 }))
  const pct: Record<string, number> = {}
  let used = 0
  for (const r of raw) {
    pct[r.k] = Math.floor(r.exact)
    used += pct[r.k]
  }
  const order = [...raw].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))
  for (let i = 0; i < 100 - used; i++) pct[order[i % order.length].k] += 1
  return { show: true, pct }
}

// ---- 기기 표시: 오늘 이미 눌렀는지·무엇을 골랐는지만 기억한다 (서버가 진짜 중복을 막는다) ----
const markerKey = (kind: VoteKind, target: string) => `pv:${kind}:${target}:${kstDay(new Date())}`

export function readMarker(kind: VoteKind, target: string): string | null {
  try {
    return window.localStorage.getItem(markerKey(kind, target))
  } catch {
    return null
  }
}

const markerListeners = new Set<() => void>()

export function writeMarker(kind: VoteKind, target: string, value: string): void {
  try {
    window.localStorage.setItem(markerKey(kind, target), value)
  } catch {
    /* 저장소가 막혀 있어도 화면은 동작한다 */
  }
  markerListeners.forEach((l) => l())
}

/** 이 기기에서 오늘 이미 눌렀다면 저장된 값(고른 option), 아니면 null. 서버 렌더에서는 항상 null */
export function useMarker(kind: VoteKind, target: string): string | null {
  return useSyncExternalStore(
    (cb) => {
      markerListeners.add(cb)
      return () => {
        markerListeners.delete(cb)
      }
    },
    () => readMarker(kind, target),
    () => null,
  )
}

// ---- 인물별 집계 저장소: 위젯 여러 개가 같은 집계를 한 번만 받아 나눠 쓴다 ----
interface Snap {
  stats: PersonStats | null
  disabled: boolean
}
interface Entry {
  snap: Snap
  fetchedAt: number
  inflight: boolean
  listeners: Set<() => void>
}

const STALE_MS = 30_000
const SERVER_SNAP: Snap = { stats: null, disabled: false }
const store = new Map<string, Entry>()

function entryOf(id: string): Entry {
  let e = store.get(id)
  if (!e) {
    e = { snap: SERVER_SNAP, fetchedAt: 0, inflight: false, listeners: new Set() }
    store.set(id, e)
  }
  return e
}

function setSnap(id: string, snap: Snap) {
  const e = entryOf(id)
  e.snap = snap
  e.listeners.forEach((l) => l())
}

function isStats(v: unknown): v is PersonStats {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.cheer === 'number' && typeof o.duel === 'object' && typeof o.scene === 'object' && typeof o.verdict === 'object'
}

/**
 * 투표 응답의 집계를 현재 인물의 집계에 반영한다. 대결 응답은 duel 만 받아들인다
 * (서버가 page 기준으로 주지만, 서로 라이벌인 쌍에서 남의 응원·평 숫자가 섞이지 않도록 한 번 더 막는다).
 * 응답 집계가 null 이면 숫자를 숨긴다.
 */
export function mergeVoteStats(kind: VoteKind, prev: PersonStats | null, next: PersonStats | null): PersonStats | null {
  if (next === null) return null
  if (kind === 'duel' && prev) return { ...prev, duel: next.duel }
  return next
}

async function loadStats(id: string) {
  const e = entryOf(id)
  if (e.inflight || (e.fetchedAt && Date.now() - e.fetchedAt < STALE_MS)) return
  e.inflight = true
  try {
    const res = await fetch(`/api/people/stats?id=${encodeURIComponent(id)}`)
    if (res.status === 503) setSnap(id, { stats: null, disabled: true })
    else if (res.ok) {
      const data: unknown = await res.json()
      setSnap(id, { stats: isStats(data) ? data : null, disabled: false })
    }
    // 그 밖의 실패(400·502)는 숫자만 숨긴다
  } catch {
    /* 네트워크 실패: 숫자만 숨긴다 */
  } finally {
    e.inflight = false
    e.fetchedAt = Date.now()
  }
}

export interface PersonStatsApi {
  stats: PersonStats | null
  disabled: boolean
  /** 성공이면 { counted }, 속도 제한(429)이면 'limited', 그 밖의 실패는 null */
  vote(kind: VoteKind, target: string, option: string): Promise<{ counted: boolean } | 'limited' | null>
}

/** 마운트 때 /api/people/stats 를 한 번(같은 인물의 위젯끼리 공유). 503이면 disabled. */
export function usePersonStats(id: string): PersonStatsApi {
  const subscribe = useCallback(
    (cb: () => void) => {
      const e = entryOf(id)
      e.listeners.add(cb)
      return () => {
        e.listeners.delete(cb)
      }
    },
    [id],
  )
  const snap = useSyncExternalStore(
    subscribe,
    () => entryOf(id).snap,
    () => SERVER_SNAP,
  )

  useEffect(() => {
    void loadStats(id)
  }, [id])

  const vote = useCallback(
    async (kind: VoteKind, target: string, option: string) => {
      try {
        const res = await fetch('/api/people/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, target, option, page: id }),
        })
        if (res.status === 503) {
          setSnap(id, { stats: null, disabled: true })
          return null
        }
        if (res.status === 429) return 'limited'
        if (!res.ok) return null
        const data = (await res.json()) as { ok?: boolean; counted?: unknown; stats?: unknown }
        if (!data.ok) return null
        // 투표 응답의 집계를 쓴다. 집계 읽기만 실패했으면(null) 숫자를 숨긴다
        setSnap(id, { stats: mergeVoteStats(kind, entryOf(id).snap.stats, isStats(data.stats) ? data.stats : null), disabled: false })
        entryOf(id).fetchedAt = Date.now()
        return { counted: data.counted === true }
      } catch {
        return null
      }
    },
    [id],
  )

  return { stats: snap.stats, disabled: snap.disabled, vote }
}

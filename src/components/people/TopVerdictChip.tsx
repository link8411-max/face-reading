'use client'

import { ratioView, usePersonStats } from './usePersonStats'

// 한 줄 평 집계가 10표 이상이면 가장 많이 고른 라벨을 머리 카드에 칩으로 보여 준다
export default function TopVerdictChip({ id, options }: { id: string; options: { key: string; label: string }[] }) {
  const { stats } = usePersonStats(id)
  if (!stats) return null
  const counts = Object.fromEntries(options.map((o) => [o.key, stats.verdict[o.key] ?? 0]))
  if (!ratioView(counts).show) return null
  const top = options.reduce((best, o) => (counts[o.key] > counts[best.key] ? o : best), options[0])
  return (
    <p className="mt-2">
      <span data-top-verdict className="inline-block rounded-full border border-accent/40 bg-card-2 px-3 py-1 text-xs text-accent">
        많이 고른 평 · {top.label}
      </span>
    </p>
  )
}

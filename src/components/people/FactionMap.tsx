import Link from 'next/link'
import { getCharacterById } from '@/lib/samgukDB'
import { relationsOf } from '@/lib/people/relations'

const MAX_NODES = 12
const SIZE = 360
const C = SIZE / 2
const R = 134

// 세력 하나의 주요 인물(관계가 많은 순 최대 12명)을 원형으로 놓고, 그 사이의 관계선을 긋는다.
// 혈연·혼인은 실선, 그 밖은 점선. 전체 관계는 페이지의 글 목록이 맡는다(검색 로봇은 그림을 못 읽는다).
export default function FactionMap({ ids, label }: { ids: string[]; label: string }) {
  const shown = ids
    .map((id, order) => ({ id, order, count: relationsOf(id).length }))
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, MAX_NODES)
    .sort((a, b) => a.order - b.order)
  const pos = new Map(
    shown.map((s, i) => {
      const a = (i / shown.length) * Math.PI * 2 - Math.PI / 2
      return [s.id, { x: C + R * Math.cos(a), y: C + R * Math.sin(a) }] as const
    }),
  )
  const edges: { a: string; b: string; kin: boolean }[] = []
  const seen = new Set<string>()
  for (const s of shown) {
    for (const r of relationsOf(s.id)) {
      if (!r.otherId || !pos.has(r.otherId)) continue
      const key = [s.id, r.otherId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ a: s.id, b: r.otherId, kin: r.kin })
    }
  }
  const hidden = ids.length - shown.length

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${label} 인물 관계도`} className="w-full max-w-[360px] mx-auto">
        {edges.map((e) => {
          const p = pos.get(e.a)!
          const q = pos.get(e.b)!
          return (
            <g key={`${e.a}-${e.b}`} className={e.kin ? 'text-accent' : 'text-muted'}>
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="currentColor" strokeWidth={e.kin ? 2 : 1.2} strokeDasharray={e.kin ? undefined : '4 4'} />
            </g>
          )
        })}
        {shown.map((s) => {
          const p = pos.get(s.id)!
          const name = getCharacterById(s.id)?.name ?? s.id
          return (
            <Link key={s.id} href={`/samguk/people/${s.id}`}>
              <rect x={p.x - 28} y={p.y - 14} width={56} height={28} rx={14} className="fill-white stroke-line" strokeWidth={1} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="fill-ink" fontSize={12}>{name}</text>
            </Link>
          )
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-muted">
        실선은 혈연·혼인, 점선은 그 밖의 관계예요.{hidden > 0 && ` 관계가 많은 ${shown.length}명만 그렸고, 나머지는 아래 카드에 있어요.`}
      </p>
    </div>
  )
}

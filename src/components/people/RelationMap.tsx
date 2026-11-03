import Link from 'next/link'
import { allSamgukCharacters } from '@/lib/samgukDB'
import { relationsOf, type RelationView } from '@/lib/people/relations'
import SourceChip from './SourceChip'

const MAX_NODES = 10
const SIZE = 360
const CX = SIZE / 2
const R = 132

// 가운데 인물 + 관계 상대를 원형으로 둔 그림(최대 10명). 혈연은 실선, 그 밖은 점선.
// 검색 로봇은 그림을 못 읽으므로 같은 내용을 아래 글 목록으로도 적는다.
export default function RelationMap({ centerId }: { centerId: string }) {
  const centerName = allSamgukCharacters.find((c) => c.id === centerId)?.name ?? centerId
  const rels = relationsOf(centerId)
  if (rels.length === 0) return <p className="text-sm text-muted">정리된 관계가 아직 없어요.</p>

  const shown = [...rels.filter((r) => r.kin), ...rels.filter((r) => !r.kin)].slice(0, MAX_NODES)
  const kin = rels.filter((r) => r.kin)
  const other = rels.filter((r) => !r.kin)

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${centerName}의 관계도`} className="w-full max-w-[360px] mx-auto">
        {shown.map((r, i) => {
          const a = (i / shown.length) * Math.PI * 2 - Math.PI / 2
          const x = CX + R * Math.cos(a)
          const y = CX + R * Math.sin(a)
          return (
            <g key={`${r.otherId ?? r.otherName}-${i}`}>
              <g className={r.kin ? 'text-accent' : 'text-muted'}>
                <line x1={CX} y1={CX} x2={x} y2={y} stroke="currentColor" strokeWidth={r.kin ? 2 : 1.4} strokeDasharray={r.kin ? undefined : '4 4'} />
              </g>
              <rect x={x - 30} y={y - 15} width={60} height={30} rx={15} className="fill-white stroke-line" strokeWidth={1} />
              <text x={x} y={y - 1} textAnchor="middle" className="fill-ink" fontSize={12}>{r.otherName}</text>
              <text x={x} y={y + 11} textAnchor="middle" className="fill-muted" fontSize={9}>{r.type}</text>
            </g>
          )
        })}
        <circle cx={CX} cy={CX} r={34} className="fill-ink" />
        <text x={CX} y={CX + 5} textAnchor="middle" className="fill-paper" fontSize={14} fontWeight={700}>{centerName}</text>
      </svg>
      <p className="mt-1 text-center text-xs text-muted">실선은 혈연·혼인, 점선은 그 밖의 관계예요.</p>

      <RelationList title="혈연" items={kin} />
      <RelationList title="그 밖의 관계" items={other} />
    </div>
  )
}

function RelationList({ title, items }: { title: string; items: RelationView[] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-4">
      <h4 className="font-bold text-sm mb-2">{title}</h4>
      <ul className="space-y-2 text-sm leading-relaxed">
        {items.map((r, i) => (
          <li key={`${r.otherId ?? r.otherName}-${i}`}>
            {r.hasPage && r.otherId ? (
              <Link href={`/samguk/people/${r.otherId}`} className="font-medium underline">{r.otherName}</Link>
            ) : (
              <span className="font-medium">{r.otherName}</span>
            )}
            <span className="text-muted"> ({r.type})</span> {r.note}
            <SourceChip source={r.source} />
          </li>
        ))}
      </ul>
    </div>
  )
}

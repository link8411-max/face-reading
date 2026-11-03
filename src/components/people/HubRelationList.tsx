import Link from 'next/link'
import type { HubLine } from '@/lib/people/hubRelations'
import SourceChip from './SourceChip'

function Name({ id, name, page }: { id: string | null; name: string; page: boolean }) {
  return page && id ? <Link href={`/samguk/people/${id}`} className="font-medium underline">{name}</Link> : <span className="font-medium">{name}</span>
}

// 관계를 한 줄씩 적은 글 목록(검색 로봇용이기도 하다)
export default function HubRelationList({ lines }: { lines: HubLine[] }) {
  if (lines.length === 0) return null
  return (
    <ul className="space-y-2 text-sm leading-relaxed">
      {lines.map((l, i) => (
        <li key={`${l.aId}-${l.otherId ?? l.otherName}-${i}`}>
          <Name id={l.aId} name={l.aName} page />
          <span className="text-muted"> · </span>
          <Name id={l.otherId} name={l.otherName} page={l.otherHasPage} />
          <span className="text-muted"> ({l.type})</span> {l.note}
          <SourceChip source={l.source} />
        </li>
      ))}
    </ul>
  )
}

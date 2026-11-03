// 허브 페이지의 관계 글 목록. 같은 쌍은 한 번만 적고, 세력을 넘는 관계는 따로 모은다.
import { getCharacterById } from '@/lib/samgukDB'
import { PEOPLE_IDS } from '@/content/samgukPeople'
import { relationsOf } from './relations'
import type { RelationType, Source } from '@/content/samgukPeople/types'

export interface HubLine {
  aId: string
  aName: string
  otherId: string | null
  otherName: string
  otherHasPage: boolean
  type: RelationType
  note: string
  source: Source
}

type Faction = '위' | '촉' | '오' | '기타'

const factionOf = (id: string): Faction | null => (getCharacterById(id)?.faction as Faction | undefined) ?? null
const nameOf = (id: string) => getCharacterById(id)?.name ?? id

// within: 세력 안(상대가 이름만 있는 경우 포함), cross: 열전이 있는 두 인물이 서로 다른 세력
export function hubRelations(): { within: Record<string, HubLine[]>; cross: HubLine[] } {
  const within: Record<string, HubLine[]> = {}
  const cross: HubLine[] = []
  const seen = new Set<string>()
  for (const id of PEOPLE_IDS) {
    const f = factionOf(id)
    if (!f) continue
    for (const r of relationsOf(id)) {
      if (r.otherId) {
        const key = [id, r.otherId].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)
      }
      const line: HubLine = { aId: id, aName: nameOf(id), otherId: r.otherId, otherName: r.otherName, otherHasPage: r.hasPage, type: r.type, note: r.note, source: r.source }
      const otherFaction: Faction | null = r.hasPage && r.otherId ? factionOf(r.otherId) : f
      if (otherFaction && otherFaction !== f) cross.push(line)
      else (within[f] ??= []).push(line)
    }
  }
  return { within, cross }
}

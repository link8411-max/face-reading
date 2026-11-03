// 열전의 relations에서 관계 목록·세력 묶음을 만든다.
import { allSamgukCharacters } from '@/lib/samgukDB'
import { PEOPLE, PEOPLE_IDS } from '@/content/samgukPeople'
import { KIN_TYPES, type RelationType, type Source } from '@/content/samgukPeople/types'

export interface RelationView {
  otherId: string | null
  otherName: string
  type: RelationType
  note: string
  source: Source
  hasPage: boolean
  kin: boolean
}

const NAME_BY_ID = new Map(allSamgukCharacters.map((c) => [c.id, c.name]))
const FACTION_BY_ID = new Map(allSamgukCharacters.map((c) => [c.id, c.faction]))

// 내 relations + 남의 relations 중 나를 가리키는 것. otherId 기준 중복 제거(내 쪽 우선).
export function relationsOf(id: string): RelationView[] {
  const out: RelationView[] = []
  const seen = new Set<string>()
  const push = (otherId: string | null, name: string | undefined, r: { type: RelationType; note: string; source: Source }) => {
    if (otherId) {
      if (seen.has(otherId)) return
      seen.add(otherId)
    }
    out.push({
      otherId,
      otherName: (otherId && NAME_BY_ID.get(otherId)) || name || otherId || '',
      type: r.type,
      note: r.note,
      source: r.source,
      hasPage: otherId !== null && otherId in PEOPLE,
      kin: KIN_TYPES.includes(r.type),
    })
  }
  const me = PEOPLE[id]
  if (me) for (const r of me.relations) push(r.id ?? null, r.name, r)
  for (const otherId of PEOPLE_IDS) {
    if (otherId === id) continue
    for (const r of PEOPLE[otherId].relations) if (r.id === id) push(otherId, undefined, r)
  }
  return out
}

const FACTION_ORDER = ['위', '촉', '오', '기타'] as const

// 세력별 묶음(열전이 있는 인물만, 비는 세력은 뺀다)
export function factionGroups(): { faction: '위' | '촉' | '오' | '기타'; ids: string[] }[] {
  return FACTION_ORDER.map((faction) => ({
    faction,
    ids: PEOPLE_IDS.filter((id) => FACTION_BY_ID.get(id) === faction),
  })).filter((g) => g.ids.length > 0)
}

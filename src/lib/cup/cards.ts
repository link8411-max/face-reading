// 월드컵 카드 데이터. 열전 본문을 읽으므로 서버에서만 쓴다.
import { PEOPLE } from '@/content/samgukPeople'
import type { CupCard, MeetNote } from '@/lib/cup/types'
import { samgukCharacters } from '@/lib/samgukDB'
import { firstSentence } from '@/lib/people/hubCards'
import { portraitSrc } from '@/lib/people/portrait'
import { relationsOf } from '@/lib/people/relations'
import { pairKey } from '@/lib/people/keys'

export type { CupCard, MeetNote } from '@/lib/cup/types'

export function cupCards(ids: string[]): CupCard[] {
  const out: CupCard[] = []
  for (const id of ids) {
    const c = samgukCharacters.find((x) => x.id === id)
    const p = PEOPLE[id]
    const portrait = portraitSrc(id)
    if (!c || !p || !portrait) continue
    // 다른 사람 이야기가 이 카드에 붙지 않게, 이름이 들어간 이야기를 먼저 쓴다(없으면 전부)
    const named = p.funFacts.filter((f) => f.includes(c.name))
    out.push({ id, name: c.name, faction: c.faction, portrait, line: firstSentence(p.summary), facts: [...(named.length ? named : p.funFacts)] })
  }
  return out
}

export function meetNotes(ids: string[]): Record<string, MeetNote> {
  const set = new Set(ids)
  const out: Record<string, MeetNote> = {}
  // 같은 쌍은 사전순 앞 id 쪽 관계를 우선: id 오름차순으로 돌며 먼저 채운 것을 유지한다.
  for (const id of Array.from(set).sort()) {
    for (const r of relationsOf(id)) {
      if (!r.otherId || !set.has(r.otherId) || r.otherId === id) continue
      const key = pairKey(id, r.otherId)
      if (key in out) continue
      out[key] = { note: r.note, source: r.source }
    }
  }
  return out
}

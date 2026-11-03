// 열전 등록부. 열전이 있는 인물만 여기에 넣는다(없는 인물은 페이지를 만들지 않는다).
import type { PersonEntry } from './types'
import { caocao } from './caocao'
import { guanyu } from './guanyu'

const ENTRIES: PersonEntry[] = [caocao, guanyu]

export const PEOPLE: Record<string, PersonEntry> = Object.fromEntries(ENTRIES.map((e) => [e.id, e]))

export const PEOPLE_IDS: string[] = ENTRIES.map((e) => e.id)

export function getPerson(id: string): PersonEntry | undefined {
  return PEOPLE[id]
}

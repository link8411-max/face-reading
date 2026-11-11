// 부적 조립 규칙: 순수 함수. 같은 입력이면 항상 같은 결과다.
import { computeSaju } from '@/lib/saju/engine'
import { ELEMENTS, type Element } from '@/lib/saju/keys'
import { EL_KEYS, VARIANTS, WISH_DEFAULT_EL, type BujeokSpec, type ElKey, type Wish } from './keys'

/**
 * 가장 적은 기운을 고른다. 여럿이면 소원의 기본 기운이 그 안에 있을 때 그것,
 * 없으면 후보(목화토금수 순)에서 day % 후보 수 번째.
 */
export function pickElement(counts: Record<Element, number>, wish: Wish, day: number): ElKey {
  const min = Math.min(...ELEMENTS.map((e) => counts[e]))
  const cands = EL_KEYS.filter((_, i) => counts[ELEMENTS[i]] === min)
  if (cands.length === 1) return cands[0]
  const def = WISH_DEFAULT_EL[wish]
  if (cands.includes(def)) return def
  return cands[((day % cands.length) + cands.length) % cands.length]
}

export type BirthInput = { year: number; month: number; day: number; isLunar: boolean; isLeapMonth: boolean }

/** 생년월일(시간 없음)에서 기운을 구한다. 계산 실패(범위 밖·없는 날짜)면 null */
export function elementFromBirth(b: BirthInput, wish: Wish): ElKey | null {
  const r = computeSaju({ ...b, hourSlot: null, gender: null, asOfYear: new Date().getFullYear() })
  if (!r.ok) return null
  return pickElement(r.elements, wish, r.solar.day)
}

export function partsFor(spec: BujeokSpec): { border: 0 | 1; head: 0 | 1 } {
  return { border: ((spec.variant >> 1) & 1) as 0 | 1, head: (spec.variant & 1) as 0 | 1 }
}

export function randomVariant(rand: () => number = Math.random): number {
  return Math.min(VARIANTS - 1, Math.floor(rand() * VARIANTS))
}

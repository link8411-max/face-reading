// 부적을 정하는 값의 키와 타입. 값만 있고 로직은 없다. (설계: docs/superpowers/specs/2026-11-11-bujeok-design.md)

export const STYLES = ['trad', 'cute'] as const
export type BujeokStyle = (typeof STYLES)[number]

export const WISHES = ['money', 'pass', 'health', 'love', 'guard'] as const
export type Wish = (typeof WISHES)[number]

/** ELEMENTS(목화토금수)와 같은 순서 */
export const EL_KEYS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
export type ElKey = (typeof EL_KEYS)[number]

/** 테두리 2 × 머리 문양 2 */
export const VARIANTS = 4

export const WISH_DEFAULT_EL: Record<Wish, ElKey> = { money: 'metal', pass: 'wood', health: 'earth', love: 'fire', guard: 'water' }

export interface BujeokSpec {
  style: BujeokStyle
  wish: Wish
  el: ElKey
  variant: number
}

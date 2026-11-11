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

/** 마감: 종이(승인한 그림 그대로) · 금박(먹색 바탕에 금색 선) · 홀로그램(금박 + 각도에 따라 무지갯빛) */
export const FINISHES = ['paper', 'gold', 'holo'] as const
export type Finish = (typeof FINISHES)[number]
export const FINISH_LABEL: Record<Finish, string> = { paper: '종이', gold: '금박', holo: '홀로그램' }
export const FINISH_DEFAULT: Finish = 'gold'

export interface BujeokSpec {
  style: BujeokStyle
  wish: Wish
  el: ElKey
  variant: number
  finish: Finish
}

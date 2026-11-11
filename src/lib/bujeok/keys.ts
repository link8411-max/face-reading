// 부적을 정하는 값의 키와 타입. 값만 있고 로직은 없다. (설계: docs/superpowers/specs/2026-11-11-bujeok-design.md)

export const STYLES = ['trad', 'cute'] as const
export type BujeokStyle = (typeof STYLES)[number]

/** 기존 다섯 개의 순서는 그대로 두고 새 소원은 뒤에 붙인다(화면 순서는 WISH_ORDER) */
export const WISHES = ['money', 'pass', 'health', 'love', 'guard', 'allgood', 'career', 'business', 'family', 'samjae', 'wish'] as const
export type Wish = (typeof WISHES)[number]

/** 소원 고르기 화면 순서: 많이 찾을 순서(설계 16절) */
export const WISH_ORDER: readonly Wish[] = ['money', 'pass', 'allgood', 'health', 'love', 'career', 'business', 'family', 'wish', 'samjae', 'guard']

/** ELEMENTS(목화토금수)와 같은 순서 */
export const EL_KEYS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
export type ElKey = (typeof EL_KEYS)[number]

/** 테두리 2 × 머리 문양 2 */
export const VARIANTS = 4

export const WISH_DEFAULT_EL: Record<Wish, ElKey> = {
  money: 'metal', pass: 'wood', health: 'earth', love: 'fire', guard: 'water',
  allgood: 'earth', career: 'metal', business: 'wood', family: 'earth', samjae: 'water', wish: 'fire',
}

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
  /** 전통 화풍 몸통 획(encodeStroke 결과, 's'+24자). 없으면 기본 획 */
  stroke?: string
}

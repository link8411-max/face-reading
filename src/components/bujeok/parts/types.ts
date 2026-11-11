import type { BujeokSpec } from '@/lib/bujeok/keys'

/** 그려지는 요소의 종류. 요소마다 data-a="<StrokeKind>"를 달고, DOM 순서가 곧 그리는 순서다
 *  (테두리 → 머리 → 몸통 → 상징 → 글귀 → 도장). */
export type StrokeKind = 'draw' | 'pop' | 'fade' | 'stamp'

export interface KitProps {
  spec: BujeokSpec
  /** cleanName을 통과한 이름. 없으면 도장에 '복' */
  name: string | null
  /** 종이 질감·붓 번짐 필터를 끈다(작은 격자용) */
  lite?: boolean
}

/** 도장에 넣을 글자: 공백을 빼고 앞에서 네 글자까지 */
export function stampChars(name: string | null): string[] {
  const chars = [...(name ?? '').replace(/\s/g, '')].slice(0, 4)
  return chars.length ? chars : ['복']
}

export const ring = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`

import type { Pt } from '@/lib/bujeok/brush'
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
  /** 전통: 몸통 획을 그리지 않는다(점안에서 긋기 전) */
  hideSpine?: boolean
  /** 도장을 그리지 않는다(전통은 吉 도장과 이름 도장, 귀여운은 아래 태그) */
  hideSeal?: boolean
  /** 전통: 그리는 도중 미리보기용 몸통 점 */
  spine?: Pt[]
}

/** 도장에 넣을 글자: 공백을 빼고 앞에서 네 글자까지 */
export function stampChars(name: string | null): string[] {
  const chars = [...(name ?? '').replace(/\s/g, '')].slice(0, 4)
  return chars.length ? chars : ['복']
}

export const ring = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`

// 부적 전용 색. globals.css의 --color-bujeok-* 토큰과 같은 값이다(tests/bujeok/svg.test.tsx가 맞춰 본다).
// SVG 속성에 CSS 변수 대신 이 값을 직접 넣는다 — 저장용 이미지로 옮길 때 변수가 풀리지 않는 일을 막는다.
import type { ElKey, Wish } from './keys'

export const PAL = {
  paper: '#E6C35C',
  paperEdge: '#C99E3A',
  jusa: '#B3261E',
  stampInk: '#F5E2A6',
  cutePaper: '#FFFAF2',
  cuteInk: '#5B4037',
  cuteLine: '#F3A8B4',
  cuteTag: '#E2574C',
  cuteCheek: '#FF9AA8',
} as const

export const EL_COLOR: Record<ElKey, string> = {
  wood: '#3E7B55',
  fire: '#D0532F',
  earth: '#A9762B',
  metal: '#8A8377',
  water: '#2F5F8A',
}

/** 귀여운 화풍 장식 색(밝은 종이 위) */
export const EL_COLOR_CUTE: Record<ElKey, string> = {
  wood: '#7FD1AE',
  fire: '#FF8A65',
  earth: '#E0B36A',
  metal: '#B9B2A6',
  water: '#7DB7E8',
}

export const MASCOT_COLOR: Record<Wish, string> = {
  money: '#FFD35E',
  pass: '#A9E2C6',
  health: '#FFB9A8',
  love: '#FF9AA8',
  guard: '#FFC46B',
}

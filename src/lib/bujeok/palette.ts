// 부적 전용 색. globals.css의 --color-bujeok-* 토큰과 같은 값이다(tests/bujeok/svg.test.tsx가 맞춰 본다).
// SVG 속성에 CSS 변수 대신 이 값을 직접 넣는다 — 저장용 이미지로 옮길 때 변수가 풀리지 않는 일을 막는다.
import type { BujeokStyle, ElKey, Finish, Wish } from './keys'

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
  cutePill: '#FFE3E8',
  cuteSub: '#B48A7C',
  tradBack: '#8F1D17',
} as const

/** 금박·홀로그램 전용 색. 바탕에 붉은 기운이 없다(설계 13절) */
export const FOIL = {
  lacquer: '#17140F',
  cuteBase: '#2B1D3A',
  cutePill: '#3C2A50',
  gold: '#E9C46A',
  goldDeep: '#B8862B',
  stops: ['#FFF3C4', '#E9C46A', '#B8862B', '#F6DD95', '#C9982F'],
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

/** 카드(종이) 영역. SVG 좌표계(0 0 300 520) 기준이고 화풍마다 다르다 */
export const CARD_BOX: Record<BujeokStyle, { x: number; y: number; w: number; h: number }> = {
  trad: { x: 30, y: 6, w: 240, h: 508 },
  cute: { x: 24, y: 6, w: 252, h: 508 },
}

/** 종이 질감 색 행렬(종이 / 어두운 바탕) */
const GRAIN_PAPER = '0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .05  0 0 0 .18 0'
const GRAIN_DARK = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0'

/** 금색 선 그라데이션 id. 마감마다 다르게 해서 한 화면에 여러 장이 있어도 겹치지 않는다 */
export const goldId = (finish: Finish) => `bujeok-gold-${finish}`

export interface Theme {
  finish: Finish
  /** 금박 그라데이션이 필요한가 (필요하면 SVG에 GoldDefs를 넣는다) */
  foil: boolean
  /** 그림 id (필터·그라데이션). 마감마다 다르다 */
  ids: { grain: string; edge: string; gold: string }
  /** 바탕 */
  paper: string
  /** 전통: 종이 가장자리 색 / 질감 행렬 */
  edge: string
  grain: string
  /** 선·글씨 색. 전통은 붓선·한자·기운 이름, 귀여운은 테두리·머리말 밑줄 */
  line: string
  /** 도장 바탕·글자 (전통) */
  stampFill: string
  stampInk: string
  /** 귀여운: 머리말 글자 색, 머리말 알약, 아랫줄 글씨 */
  head: string
  pill: string
  sub: string
  /** 카드 두께 옆면, 뒷면 바탕·글씨 */
  cardEdge: string
  backBg: string
  backFg: string
  /** 카드 모서리 둥글기(CSS) */
  radius: string
}

/** 화풍 × 마감이 정하는 색 묶음. 부품(trad/cute)과 카드(BujeokCard)가 이 값만 읽는다 */
export function themeFor(style: BujeokStyle, finish: Finish): Theme {
  const foil = finish !== 'paper'
  const gold = `url(#${goldId(finish)})`
  const ids = { grain: `bujeok-grain-${finish}`, edge: `bujeok-edge-${finish}`, gold: goldId(finish) }
  if (style === 'trad') {
    return foil
      ? {
          finish, foil, ids, paper: FOIL.lacquer, edge: '#000000', grain: GRAIN_DARK, line: gold,
          stampFill: gold, stampInk: FOIL.lacquer, head: gold, pill: FOIL.lacquer, sub: FOIL.gold,
          cardEdge: FOIL.goldDeep, backBg: FOIL.lacquer, backFg: FOIL.gold, radius: '6px',
        }
      : {
          finish, foil, ids, paper: PAL.paper, edge: PAL.paperEdge, grain: GRAIN_PAPER, line: PAL.jusa,
          stampFill: PAL.jusa, stampInk: PAL.stampInk, head: PAL.jusa, pill: PAL.paper, sub: PAL.jusa,
          cardEdge: PAL.paperEdge, backBg: PAL.paper, backFg: PAL.tradBack, radius: '6px',
        }
  }
  return foil
    ? {
        finish, foil, ids, paper: FOIL.cuteBase, edge: '#000000', grain: GRAIN_DARK, line: gold,
        stampFill: PAL.cuteTag, stampInk: '#FFFFFF', head: gold, pill: FOIL.cutePill, sub: FOIL.gold,
        cardEdge: FOIL.goldDeep, backBg: FOIL.cuteBase, backFg: FOIL.gold, radius: '13% / 6.5%',
      }
    : {
        finish, foil, ids, paper: PAL.cutePaper, edge: PAL.paperEdge, grain: GRAIN_PAPER, line: PAL.cuteLine,
        stampFill: PAL.cuteTag, stampInk: '#FFFFFF', head: PAL.cuteInk, pill: PAL.cutePill, sub: PAL.cuteSub,
        cardEdge: PAL.cuteLine, backBg: PAL.cutePaper, backFg: PAL.cuteInk, radius: '13% / 6.5%',
      }
}

// 월드컵 진행 상태와 비율 문구 (순수, 클라이언트 안전)
import { josa } from '@/lib/josa'

export interface CupState {
  round: string[]
  winners: string[]
  /** 이번 라운드 안의 0부터 번호 */
  match: number
  /** 이긴 id -> 그가 이긴 상대들(이긴 순서) */
  beaten: Record<string, string[]>
  champion: string | null
}

export type Others = Record<string, number> | null | 'error'

export function startCup(entrants: string[]): CupState {
  if (entrants.length !== 16 && entrants.length !== 8) throw new Error(`참가자는 16명 또는 8명이어야 해요: ${entrants.length}`)
  return { round: [...entrants], winners: [], match: 0, beaten: {}, champion: null }
}

export function currentMatch(s: CupState): [string, string] | null {
  if (s.champion !== null) return null
  return [s.round[s.match * 2], s.round[s.match * 2 + 1]]
}

export function pick(s: CupState, winnerId: string): CupState {
  const m = currentMatch(s)
  if (!m) throw new Error('이미 끝난 판이에요')
  if (winnerId !== m[0] && winnerId !== m[1]) throw new Error(`현재 대결에 없는 선택이에요: ${winnerId}`)
  const loser = winnerId === m[0] ? m[1] : m[0]
  const beaten = { ...s.beaten, [winnerId]: [...(s.beaten[winnerId] ?? []), loser] }
  const winners = [...s.winners, winnerId]
  if (s.match + 1 < s.round.length / 2) return { round: s.round, winners, match: s.match + 1, beaten, champion: null }
  if (winners.length === 1) return { round: s.round, winners: [], match: s.match + 1, beaten, champion: winners[0] }
  return { round: winners, winners: [], match: 0, beaten, champion: null }
}

export function roundLabel(size: number): string {
  return size === 2 ? '결승' : `${size}강`
}

export function progressLabel(s: CupState, boardTitle: string): string {
  if (s.round.length === 2) return `${boardTitle} 결승`
  return `${boardTitle} ${roundLabel(s.round.length)} · ${s.match + 1}/${s.round.length / 2}`
}

/** 판 전체에서 몇 번째 대결인지(1부터). 지금까지 고른 횟수 + 1 */
export function matchNumber(s: CupState): number {
  return Object.values(s.beaten).reduce((n, l) => n + l.length, 0) + 1
}

/** 우승자가 이긴 상대, 첫 라운드부터 */
export function championPath(s: CupState): string[] {
  return s.champion ? [...(s.beaten[s.champion] ?? [])] : []
}

export function ratioMessage(others: Others, pickedId: string, pickedName: string): string {
  if (others === null) return ''
  if (others === 'error') return '지금은 다른 사람 선택을 불러오지 못했어요'
  const total = Object.values(others).reduce((a, b) => a + b, 0)
  if (total === 0) return '이 대결을 처음 골랐어요'
  if (total < 10) return `지금까지 ${total}명이 이 대결을 골랐어요`
  const pct = Math.round(((others[pickedId] ?? 0) / total) * 100)
  return `다른 사람들은 ${pct}%가 ${josa(pickedName, '을', '를')} 골랐어요`
}

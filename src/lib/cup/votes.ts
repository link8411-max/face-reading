// 장수 월드컵 투표: 요청 검증과 저장 행. 열전 투표(voteGuard)와 속도 제한을 나누지 않는다.
import { createGuard } from '@/lib/duel/feedbackGuard'
import { pairKey, type VoteKind } from '@/lib/people/votes'
import { boardPool, isBoardKey, type BoardKey } from './boards'

export type CupVote =
  | { type: 'match'; board: BoardKey; a: string; b: string; pick: string }
  | { type: 'win'; board: BoardKey; id: string }

/** 월드컵 API 속도 제한: 10분에 200회(한 판이 15경기 안팎) */
export const cupGuard = createGuard(200)

export function validateCupVote(body: unknown): CupVote | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const o = body as Record<string, unknown>
  if (!isBoardKey(o.board)) return null
  const board = o.board
  const pool = boardPool(board)
  if (o.type === 'match') {
    const { a, b, pick } = o
    if (typeof a !== 'string' || typeof b !== 'string' || typeof pick !== 'string') return null
    if (a === b || !pool.includes(a) || !pool.includes(b) || (pick !== a && pick !== b)) return null
    return { type: 'match', board, a, b, pick }
  }
  if (o.type === 'win') {
    const { id } = o
    if (typeof id !== 'string' || !pool.includes(id)) return null
    return { type: 'win', board, id }
  }
  return null
}

export function cupRow(v: CupVote): { kind: Extract<VoteKind, 'cup_match' | 'cup_win'>; target: string; option: string } {
  return v.type === 'match'
    ? { kind: 'cup_match', target: pairKey(v.a, v.b), option: v.pick }
    : { kind: 'cup_win', target: v.board, option: v.id }
}

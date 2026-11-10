// 친구 대결 링크. 서버 없이 링크만으로 동작한다. 이름·태어난 해는 싣지 않는다.
import { SITE, UTM } from '@/lib/shareBase'

export interface Shared {
  round: number
  marks: string // 'OXOOX'
  score: number
  grade: number
  hint: boolean
}

export function encodeShared(s: Shared): string {
  return `${s.round}-${s.marks}-${s.score}-${s.grade}${s.hint ? 'h' : ''}`
}

const FORMAT = /^(\d{1,4})-([OX]{5})-(\d{1,3})-(\d)(h?)$/

/** 허용 형식만 받는다. 형식 밖이면 null(일반 착지로 보낸다). 링크를 고쳐 가짜 점수를 만들 수는 있지만 감수한다. */
export function parseShared(code: string, maxRound: number): Shared | null {
  const m = FORMAT.exec(code)
  if (!m) return null
  const s: Shared = { round: Number(m[1]), marks: m[2], score: Number(m[3]), grade: Number(m[4]), hint: m[5] === 'h' }
  if (encodeShared(s) !== code) return null // 03, 앞자리 0 같은 비정규 표기
  if (s.round < 1 || s.round > maxRound) return null
  if (s.grade < 1 || s.grade > 9) return null
  const correct = [...s.marks].filter((c) => c === 'O').length
  if (s.score < 0 || s.score > 600 || s.score < correct * 100 || s.score > correct * 120) return null
  return s
}

export function examSharePath(s: Shared): string {
  return `/exam/meme/r/${encodeShared(s)}`
}

export function examShareUrl(s: Shared): string {
  return `${SITE}${examSharePath(s)}?${UTM('exam_meme')}`
}

export function duelOutcome(mine: Shared, theirs: Shared): 'win' | 'lose' | 'draw' {
  if (mine.score === theirs.score) return 'draw'
  return mine.score > theirs.score ? 'win' : 'lose'
}

export function examPhrase(grade: number): string {
  return `나 밈 능력고사 ${grade}등급 나왔어. 너는?`
}

export function examOgImageUrl(grade: number, correct: number): string {
  return `${SITE}/api/og/result?kind=exam&grade=${grade}&correct=${correct}`
}

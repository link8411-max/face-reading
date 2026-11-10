// 점수와 등급. 등급은 공유 링크·미리보기·GA 값에 쓰이므로 출시 뒤에는 표를 바꾸지 않는다.
export const LIMIT_MS = 10_000

export interface Answer {
  correct: boolean
  msLeft: number
  hint: boolean
}

/** 오답 0. 정답 100 + 남은 시간 비례 가산(최대 20). 힌트를 썼으면 가산 0. */
export function questionScore(a: Answer): number {
  if (!a.correct) return 0
  if (a.hint) return 100
  const ratio = Math.min(Math.max(a.msLeft, 0), LIMIT_MS) / LIMIT_MS
  return 100 + Math.round(20 * ratio)
}

export function total(answers: Answer[]): { score: number; correct: number; bonus: number } {
  let score = 0
  let correct = 0
  for (const a of answers) {
    const s = questionScore(a)
    score += s
    if (a.correct) correct++
  }
  return { score, correct, bonus: score - correct * 100 }
}

/** 맞힌 개수가 뼈대, 가산점 합이 경계를 가른다. */
export function grade(correct: number, bonus: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  if (correct >= 5) return bonus >= 50 ? 1 : 2
  if (correct === 4) return bonus >= 40 ? 3 : 4
  if (correct === 3) return bonus >= 30 ? 5 : 6
  if (correct === 2) return 7
  if (correct === 1) return 8
  return 9
}

export const GRADE_NAME: Record<number, string> = {
  1: '밈 고인물',
  2: '단톡방 통역사',
  3: '눈팅은 하는 사람',
  4: '반은 알아듣는 사람',
  5: '검색하며 따라가는 사람',
  6: '조카에게 배우는 중',
  7: '뉴스로 유행을 아는 사람',
  8: '한 박자 늦게 아는 사람',
  9: '오늘부터 시작하는 사람',
}

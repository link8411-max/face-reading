// 밈 능력고사 집계: 검증과 화면 문구. 클라이언트와 서버가 함께 쓰므로 데이터·서버 모듈을 가져오지 않는다.

/** 이 수보다 적게 푼 문제는 정답률을 숨긴다(가짜 숫자 금지 규칙: 표본이 모자라면 칸을 숨긴다) */
export const MIN_SOLVERS = 30

export interface QuestionStat {
  n: number
  correct: number
}

export interface PlayInput {
  round: number
  marks: string
  score: number
  grade: number
}

const isInt = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi

/** 저장 요청 본문 검사. 회차는 1~maxRound(오늘 회차, 얼린 회차 수를 넘지 않음), 정오는 O·X 다섯 칸 */
export function validatePlay(body: unknown, maxRound: number): PlayInput | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const b = body as Record<string, unknown>
  if (Object.keys(b).some((k) => !['round', 'marks', 'score', 'grade'].includes(k))) return null
  if (!isInt(b.round, 1, maxRound)) return null
  if (typeof b.marks !== 'string' || !/^[OX]{5}$/.test(b.marks)) return null
  if (!isInt(b.score, 0, 600) || !isInt(b.grade, 1, 9)) return null
  return { round: b.round, marks: b.marks, score: b.score, grade: b.grade }
}

/** 회차 번호 쿼리 값 검사(1~maxRound 정수 문자열만) */
export function parseRound(raw: string | null, maxRound: number): number | null {
  if (raw === null || !/^[1-9]\d{0,3}$/.test(raw)) return null
  const n = Number(raw)
  return n <= maxRound ? n : null
}

/** 문제 하나의 정답률 문구. 표본이 MIN_SOLVERS 미만이거나 값이 이상하면 null(칸을 숨긴다) */
export function rateText(s: QuestionStat | null | undefined): string | null {
  if (!s || !Number.isFinite(s.n) || !Number.isFinite(s.correct)) return null
  if (s.n < MIN_SOLVERS || s.correct < 0 || s.correct > s.n) return null
  return `푼 사람의 ${Math.round((s.correct / s.n) * 100)}%가 맞혔어요`
}

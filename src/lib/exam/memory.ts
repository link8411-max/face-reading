// 이 기기에만 남기는 기억: 회차별 성적표와 연속 응시. 서버·GA로 보내지 않는다.
// 저장소를 못 쓰는 환경(사파리 개인정보 보호 모드, 인앱 브라우저)에서는 모든 함수가 조용히 null/0/무동작이다.
export interface Report {
  round: number
  marks: string // 'OXOOX'
  score: number
  correct: number
  grade: number
  hint: boolean
  ms: number
}

const KEY = 'exam-meme-v1'
interface Stored {
  reports: Record<string, Report>
  lastRound: number
  streak: number
}

const isReport = (r: unknown): r is Report => {
  const x = r as Report
  return !!x && typeof x.round === 'number' && typeof x.marks === 'string' && /^[OX]{5}$/.test(x.marks) &&
    typeof x.score === 'number' && typeof x.correct === 'number' && typeof x.grade === 'number' && typeof x.hint === 'boolean' && typeof x.ms === 'number'
}

function read(): Stored {
  const empty: Stored = { reports: {}, lastRound: 0, streak: 0 }
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    if (!raw) return empty
    const v = JSON.parse(raw) as Partial<Stored>
    return {
      reports: v.reports && typeof v.reports === 'object' ? v.reports : {},
      lastRound: typeof v.lastRound === 'number' ? v.lastRound : 0,
      streak: typeof v.streak === 'number' ? v.streak : 0,
    }
  } catch {
    return empty
  }
}

export function loadReport(round: number): Report | null {
  const r = read().reports[String(round)]
  return isReport(r) ? r : null
}

/** 성적표를 저장하고 연속 응시를 갱신한다: 직전 회차가 round-1이면 +1, 같은 회차면 그대로, 아니면 1. */
export function saveReport(r: Report): void {
  try {
    const s = read()
    s.reports[String(r.round)] = r
    if (r.round > s.lastRound) {
      s.streak = s.lastRound === r.round - 1 && s.streak > 0 ? s.streak + 1 : 1
      s.lastRound = r.round
    }
    globalThis.localStorage?.setItem(KEY, JSON.stringify(s))
  } catch {
    // 기억하지 못해도 놀이는 그대로 된다
  }
}

export function streak(): number {
  return read().streak
}

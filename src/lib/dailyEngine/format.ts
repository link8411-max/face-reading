import type { DailyFortune } from './index'

const 요일목록 = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

// 'YYYY-MM-DD' -> '11월 5일 목요일' (한국 날짜 문자열 기준, 실행 환경 시간대와 무관)
export function dayLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일 ${요일목록[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}`
}

// -> '11월 5일 목요일 · 계미일'
export function dailyDateLine(f: Pick<DailyFortune, '날짜' | '일진'>): string {
  return `${dayLabel(f.날짜)} · ${f.일진.표기}`
}

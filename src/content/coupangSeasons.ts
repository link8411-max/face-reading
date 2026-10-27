// 기간 한정 시즌 추천(쿠팡 파트너스). 날짜·링크는 이 파일에서만 관리한다 — 시즌이 바뀌면 항목을 추가한다.
import { kstDate } from '@/lib/kst'
// 날짜는 한국 시간 기준, start~end 포함. 끝나면 자동으로 숨는다(다음 시즌 링크가 없으면 슬롯을 비워 둔다).
// 링크: 쿠팡 파트너스 회원 AF6497036, 각 링크는 쿠팡 검색 결과로 이동 (2026-10-27 생성)

export interface CoupangSeason {
  id: string
  start: string // YYYY-MM-DD (KST)
  end: string // YYYY-MM-DD (KST, 포함)
  exam?: string // D-day 기준일
  title: string
  links: { key: string; label: string; url: string }[]
}

export const SEASONS: CoupangSeason[] = [
  {
    id: 'suneung-2027',
    start: '2026-10-27',
    end: '2026-11-20', // 2027학년도 수능(2026-11-19) 다음 날까지
    exam: '2026-11-19',
    title: '합격 기원 선물 모아보기',
    links: [
      { key: 'gift', label: '수능 합격 선물', url: 'https://link.coupang.com/a/iawerXakCG' },
      { key: 'chapssal', label: '합격 찹쌀떡', url: 'https://link.coupang.com/a/iawfo4cf92' },
      { key: 'yeot', label: '합격엿', url: 'https://link.coupang.com/a/iawfSajasS' },
      { key: 'snack', label: '수험생 간식 세트', url: 'https://link.coupang.com/a/iawgjyBdGS' },
    ],
  },
]


export function activeSeason(now: Date): CoupangSeason | null {
  const today = kstDate(now)
  return SEASONS.find((s) => s.start <= today && today <= s.end) ?? null
}

export function seasonHeadline(s: CoupangSeason, now: Date): string {
  if (!s.exam) return s.title
  const days = Math.round((Date.parse(s.exam) - Date.parse(kstDate(now))) / 86400000)
  if (days > 0) return `수능 D-${days}`
  if (days === 0) return '오늘이 수능, 모두 힘내요'
  return '수능 끝, 고생한 수험생에게'
}

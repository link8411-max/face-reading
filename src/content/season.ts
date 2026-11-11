// 메인 시즌 카드 — 홈에서 관상 히어로 바로 아래.
// 홈은 정적 페이지라 서버 HTML에는 항상 기본 카드 SEASON(평소: 내 사주 풀이)이 들어가고,
// 브라우저에서 마운트한 뒤 seasonFor(now)가 날짜(한국 시간)에 맞는 카드로 바꾼다(SeasonCard).
// 기간 한정 카드는 seasonFor 안에 날짜와 함께 넣는다. 기간이 끝나면 저절로 SEASON으로 돌아온다.
//
// 12/1 신년운세 시즌: 아래 주석의 값으로 SEASON을 교체한다(수능 카드는 11/20에 끝나 있다). 2/1에 다시 사주로 돌린다.
import { kstDate } from '@/lib/kst'

export interface SeasonCardData {
  chip: string
  title: string
  sub: string
  cta: { label: string; href: string }
}

export const SEASON: SeasonCardData = {
  chip: '내 사주 풀이',
  title: '내 사주,\n쉬운 말로 풀어 드려요',
  sub: '네 기둥·10년 흐름·2027년',
  cta: { label: '내 사주 보기', href: '/saju' },
}

// 12~1월(신년운세 시즌)용 — 12/1에 위 SEASON을 이 값으로 교체:
// export const SEASON = {
//   chip: '2027 정미년 신년운세',
//   title: '붉은 양의 해,\n내 운세는?',
//   sub: '생년월일로 보는 무료 사주 신년운세',
//   cta: { label: '지금 확인하기', href: '/fortune' },
// } as const

// 2027학년도 수능 — 시험일 2026-11-19, 카드는 다음 날(11/20)까지(쿠팡 시즌 추천과 같은 기간)
const SUNEUNG_DAY = '2026-11-19'
const SUNEUNG_LAST = '2026-11-20'
const SUNEUNG_CARD = {
  title: '수험생에게\n합격 부적 보내기',
  sub: '이름 도장 찍힌 부적 카드, 카톡으로 선물',
  cta: { label: '합격 부적 보내기', href: '/bujeok?mode=gift&wish=pass' },
} as const

/** 오늘(한국 시간)에 보일 시즌 카드. 수능 기간 밖이면 기본 카드(SEASON 그대로) */
export function seasonFor(now: Date): SeasonCardData {
  const today = kstDate(now)
  if (today > SUNEUNG_LAST) return SEASON
  const days = Math.round((Date.parse(SUNEUNG_DAY) - Date.parse(today)) / 86400000)
  const chip = days > 0 ? `수능 D-${days}` : days === 0 ? '수능 D-DAY' : '수능 수고했어요'
  return { chip, ...SUNEUNG_CARD }
}

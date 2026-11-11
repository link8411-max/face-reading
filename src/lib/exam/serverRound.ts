// 서버 전용: 지금 받아 줄 수 있는 가장 큰 회차(오늘 회차, 얼린 회차 수를 넘지 않음). 앞으로 나올 회차 기록은 받지 않는다.
import data from '@/content/exam/meme-rounds.json'
import { createGuard } from '@/lib/duel/feedbackGuard'
import { kstDate } from '@/lib/kst'
import { roundNumberFor } from './rounds'

export function maxRoundNow(now: Date): number {
  return Math.min(roundNumberFor(kstDate(now)), data.rounds.length)
}

/** 저장 API 보호 장치: IP당 10분 30건(설계 '저장' 절, 월드컵과 따로 센다) */
export const examGuard = createGuard(30)

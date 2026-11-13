// 홈 카드 중 캐릭터(CAST) 대신 다른 그림을 쓰는 카드.
// MBTI 카드가 모두 구미호면 "궁합" 칩에 구미호가 네 번 나와서, MBTI 카드는 MBTI 유형 그림을 쓴다(11/14 사용자).
import { mbtiArt } from '@/lib/art'
import type { MbtiType } from '@/lib/mbti/compat'

export interface HomeArt { src: string; type: MbtiType }

const mbti = (type: MbtiType): HomeArt => ({ src: mbtiArt(type).src, type })

export const HOME_ART: Record<string, HomeArt> = {
  '/fortune/mbti': mbti('ESFP'),
  '/mbti/match': mbti('ENFP'),
  '/mbti': mbti('ISFJ'),
}

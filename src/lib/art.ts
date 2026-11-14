// MBTI 16유형·띠 12 × 여·남 그림 경로(순수 함수). 큰 그림 720×960(3:4)과 얼굴 240×240.
// 그림은 scripts/make-webtoon-images.mjs가 docs/design/webtoon/originals/v2에서 만든다(파일 이름만 맞으면 다시 만들어 바뀐다).
import type { MbtiType } from '@/lib/mbti/compat'
import type { ZodiacSlug } from '@/content/fortune2027Zodiac'
import type { ArtGender } from '@/lib/animal/art'
import type { GuansangTypeKey } from '@/lib/face/guansangKeys'

export type { ArtGender }

// 처음 뽑은 한 장(mbti-<유형>.jpg)의 성별. 11/14 사용자 "MBTI도 성별이 둘 다 나와야지"로 반대 성별을 더 뽑았다(mbti-<유형>-<f|m>.jpg).
export const MBTI_BASE_GENDER: Record<MbtiType, ArtGender> = {
  INTJ: 'm', ENTP: 'm', ENFJ: 'm', ISTJ: 'm', ESTJ: 'm', ISTP: 'm', ISFP: 'm', ESTP: 'm',
  INTP: 'f', ENTJ: 'f', INFJ: 'f', INFP: 'f', ENFP: 'f', ISFJ: 'f', ESFJ: 'f', ESFP: 'f',
}

// g를 주면 그 성별 그림(<유형>-<f|m>.webp), 안 주면 처음 뽑은 한 장(<유형>.webp, 홈·허브 썸네일)
export function mbtiArt(type: MbtiType, g?: ArtGender): { src: string; face: string } {
  const k = type.toLowerCase()
  const n = g ? `${k}-${g}` : k
  return { src: `/images/mbti/${n}.webp`, face: `/images/mbti/${n}-face.webp` }
}

export function zodiacArt(slug: ZodiacSlug, g: ArtGender): { src: string; face: string } {
  return { src: `/images/zodiac/${slug}-${g}.webp`, face: `/images/zodiac/${slug}-${g}-face.webp` }
}

// 관상 15유형 × 여·남 그림(원본 face-<유형키>-<f|m>)
export function faceArt(key: GuansangTypeKey, g: ArtGender): { src: string; face: string } {
  return { src: `/images/face/${key}-${g}.webp`, face: `/images/face/${key}-${g}-face.webp` }
}

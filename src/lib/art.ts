// MBTI 16유형·띠 12 × 여·남 그림 경로(순수 함수). 큰 그림 720×960(3:4)과 얼굴 240×240.
// 그림은 scripts/make-webtoon-images.mjs가 docs/design/webtoon/originals/v2에서 만든다(파일 이름만 맞으면 다시 만들어 바뀐다).
import type { MbtiType } from '@/lib/mbti/compat'
import type { ZodiacSlug } from '@/content/fortune2027Zodiac'
import type { ArtGender } from '@/lib/animal/art'
import type { GuansangTypeKey } from '@/lib/face/guansangKeys'

export type { ArtGender }

export function mbtiArt(type: MbtiType): { src: string; face: string } {
  const k = type.toLowerCase()
  return { src: `/images/mbti/${k}.webp`, face: `/images/mbti/${k}-face.webp` }
}

export function zodiacArt(slug: ZodiacSlug, g: ArtGender): { src: string; face: string } {
  return { src: `/images/zodiac/${slug}-${g}.webp`, face: `/images/zodiac/${slug}-${g}-face.webp` }
}

// 관상 15유형 × 여·남 그림(원본 face-<유형키>-<f|m>)
export function faceArt(key: GuansangTypeKey, g: ArtGender): { src: string; face: string } {
  return { src: `/images/face/${key}-${g}.webp`, face: `/images/face/${key}-${g}-face.webp` }
}

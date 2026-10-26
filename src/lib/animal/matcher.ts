// 동물상 매칭 (MediaPipe 특징 z → 가장 가까운 동물상). 삼국지 매칭과 같은 거리·닮음 점수 규칙을 쓴다.
import type { ZVector } from '@/lib/face/featureStats'
import { distance } from '@/lib/samguk/matcher'
import { animalTypeDB, type AnimalType } from '@/lib/animalTypeDB'
import { animalProfiles } from './profiles'

export const ANIMAL_KEYS = ['dog', 'cat', 'fox', 'bear', 'rabbit', 'deer', 'tiger', 'eagle'] as const
export type AnimalKey = (typeof ANIMAL_KEYS)[number]

export interface AnimalTypeResult {
  type: AnimalKey
  data: AnimalType
  matchScore: number // 70~98
  secondaryType?: AnimalKey
  features: { 눈: string; 얼굴형: string; 턱: string; 코: string }
}

const T = 0.5 // 이 정도 이상 벗어나야 특징으로 말한다

// 특징 묘사: 한 특징의 한쪽 방향만 고르므로 '큰 가늘고 긴 눈' 같은 모순이 생기지 않는다. 표현은 모두 인상 위주로 쓴다.
export function describe(z: ZVector): AnimalTypeResult['features'] {
  const shape = z.eyeAspect >= T ? '동그란 눈' : z.eyeAspect <= -T ? '가늘고 긴 눈' : '균형 잡힌 눈'
  const tilt = z.eyeTilt >= T ? '눈꼬리가 올라간 ' : z.eyeTilt <= -T ? '눈꼬리가 순하게 내려간 ' : ''
  return {
    눈: tilt + shape,
    얼굴형: z.faceAspect >= T ? '갸름하고 긴 편' : z.faceAspect <= -T ? '동그란 편' : '균형 잡힌 편',
    턱: z.jawWidth >= T ? '다부진 턱선' : z.jawWidth <= -T ? '갸름한 턱선' : '부드러운 턱선',
    코: z.noseWidth <= -T ? '오똑하고 날렵한 코' : z.noseWidth >= T ? '복스러운 콧방울' : '반듯한 코',
  }
}

export function matchAnimal(z: ZVector, bias: Record<string, number> = {}): AnimalTypeResult {
  const ranked = ANIMAL_KEYS.map((k) => {
    const d = distance(z, animalProfiles[k])
    return { k, d, score: d + (bias[k] ?? 0) }
  }).sort((a, b) => a.score - b.score || a.k.localeCompare(b.k))
  const { k, d } = ranked[0]
  return {
    type: k,
    data: animalTypeDB[k],
    matchScore: Math.max(70, Math.min(98, Math.round(99 - 7 * d))),
    secondaryType: ranked[1].k,
    features: describe(z),
  }
}

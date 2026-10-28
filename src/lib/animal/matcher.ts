// 동물상 매칭 (MediaPipe 특징 z → 가장 가까운 동물상). 삼국지 매칭과 같은 거리·닮음 점수 규칙을 쓴다.
import type { ZVector } from '@/lib/face/featureStats'
import { distance } from '@/lib/samguk/matcher'
import { animalTypeDB, type AnimalType } from '@/lib/animalTypeDB'
import { animalProfiles } from './profiles'
import type { CharacterProfile } from '@/lib/samguk/profiles'

export const ANIMAL_KEYS = ['dog', 'cat', 'fox', 'bear', 'rabbit', 'deer', 'tiger', 'eagle'] as const
export type AnimalKey = (typeof ANIMAL_KEYS)[number]

export interface AnimalTypeResult {
  type: AnimalKey
  data: AnimalType
  matchScore: number // 70~98
  secondaryType?: AnimalKey
  blend?: AnimalKey // 2등이 1등과 거의 같으면 "○○상 기운도 함께"로 같이 알려 준다
  features: { 눈: string; 얼굴형: string; 턱: string; 코: string }
}

const T = 0.5 // 이 정도 이상 벗어나야 특징으로 말한다
// 1·2등 점수(거리+bias) 차이가 이보다 작으면 한 동물상으로 단정하지 않는다. 평범한 얼굴일수록 1·2등이 비슷하다
const BLEND_GAP = 0.15

// 특징 묘사: 한 특징의 한쪽 방향만 고르므로 '큰 가늘고 긴 눈' 같은 모순이 생기지 않는다. 표현은 모두 인상 위주로 쓴다.
// profile을 주면, 매칭된 동물상의 대표 인상(같은 화면의 설명 글)과 반대 방향인 특징은 중립 표현으로 바꾼다.
export function describe(zIn: ZVector, profile?: CharacterProfile): AnimalTypeResult['features'] {
  const z = { ...zIn }
  if (profile) {
    for (const k of ['eyeAspect', 'eyeTilt', 'faceAspect', 'jawWidth', 'noseWidth'] as const) {
      const pz = profile.z[k]
      if (pz !== undefined && Math.abs(pz) >= T && z[k] * pz < 0) z[k] = 0
    }
  }
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
    blend: ranked[1].score - ranked[0].score < BLEND_GAP ? ranked[1].k : undefined,
    features: describe(z, animalProfiles[k]),
  }
}

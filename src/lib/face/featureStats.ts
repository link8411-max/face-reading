import { FEATURE_KEYS, type FeatureKey, type FeatureVector } from './landmarkFeatures'

// 특징별 모집단 평균·표준편차 (근사값)
// mean은 테스트 기준 얼굴의 값, std는 각 특징이 사람마다 흔히 달라지는 폭의 대략 1/6로 잡았다.
// 실사진에서 측정한 값으로 반드시 다시 맞출 것 (2a 계획 Task 8). 맞춘 뒤에는 calibrate-samguk 스크립트를 다시 돌린다.
export const FEATURE_STATS: Record<FeatureKey, { mean: number; std: number }> = {
  eyeAspect: { mean: 0.4, std: 0.06 },
  eyeTilt: { mean: 0, std: 4 },
  eyeWidth: { mean: 0.5, std: 0.05 },
  eyeSpacing: { mean: 0.2143, std: 0.02 },
  browGap: { mean: 0.3, std: 0.06 },
  browTilt: { mean: 0, std: 5 },
  noseLength: { mean: 0.2778, std: 0.025 },
  noseWidth: { mean: 0.4667, std: 0.05 },
  mouthWidth: { mean: 0.8, std: 0.08 },
  lipFullness: { mean: 0.2083, std: 0.05 },
  mouthCornerLift: { mean: 0, std: 0.04 },
  faceAspect: { mean: 1.2857, std: 0.08 },
  jawWidth: { mean: 0.7857, std: 0.05 },
  chinLength: { mean: 0.2, std: 0.025 },
  midfaceRatio: { mean: 0.3556, std: 0.025 },
}

export type ZVector = Record<FeatureKey, number>

const Z_LIMIT = 3

export function toZ(f: FeatureVector): ZVector {
  const z = {} as ZVector
  for (const k of FEATURE_KEYS) {
    const { mean, std } = FEATURE_STATS[k]
    z[k] = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, (f[k] - mean) / std))
  }
  return z
}

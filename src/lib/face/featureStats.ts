import { FEATURE_KEYS, type FeatureKey, type FeatureVector } from './landmarkFeatures'

// 특징별 모집단 평균·표준편차
// 2026-10-26 실측: AI 생성 인물 사진 30장(thispersondoesnotexist.com, 실존 인물 아님)을 MediaPipe로 측정한 값.
// 표본이 작으니 실사용자 데이터가 쌓이면 다시 맞출 것. 바꾼 뒤에는 calibrate-samguk 스크립트를 다시 돌린다.
export const FEATURE_STATS: Record<FeatureKey, { mean: number; std: number }> = {
  eyeAspect: { mean: 0.3071, std: 0.048 },
  eyeTilt: { mean: 4.1899, std: 2.4183 },
  eyeWidth: { mean: 0.4496, std: 0.0181 },
  eyeSpacing: { mean: 0.2388, std: 0.0107 },
  browGap: { mean: 0.3177, std: 0.0386 },
  browTilt: { mean: -7.0948, std: 3.5763 },
  noseLength: { mean: 0.2639, std: 0.0164 },
  noseWidth: { mean: 0.7092, std: 0.0409 },
  mouthWidth: { mean: 0.9719, std: 0.1096 },
  lipFullness: { mean: 0.2501, std: 0.0509 },
  mouthCornerLift: { mean: 0.0779, std: 0.0514 },
  faceAspect: { mean: 1.1905, std: 0.051 },
  jawWidth: { mean: 0.8091, std: 0.0223 },
  chinLength: { mean: 0.2068, std: 0.0213 },
  midfaceRatio: { mean: 0.3882, std: 0.0219 },
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

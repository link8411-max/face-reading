import { FEATURE_KEYS, type FeatureKey, type FeatureVector } from './landmarkFeatures'

export type Gender = '남' | '여'

// 성별별 특징 평균·표준편차 (2b, 2026-10-26)
// 측정: 개발용 AI 생성 인물 사진(public/dev-faces, 실존 인물 아님) 중 정면(checkFrontal 통과) 성인 여 8장·남 12장을 MediaPipe로 측정
//   라벨: scripts/dev-face-genders.json, 재측정: node scripts/measure-face-stats.mjs
// 표본이 작아 성별 평균은 차이의 뚜렷함(t)만큼만 반영하고(w = t²/(1+t²)), 애매하면 공통 평균 쪽으로 당긴다.
// std는 성별 내 합동 편차로 두 성별이 같다. 실사용자 데이터가 쌓이면 다시 맞출 것.
// 바꾼 뒤에는 calibrate-samguk·calibrate-animal 스크립트를 다시 돌린다.
export const FEATURE_STATS_BY_GENDER: Record<Gender, Record<FeatureKey, { mean: number; std: number }>> = {
  여: {
    eyeAspect: { mean: 0.2937, std: 0.0352 }, // 여성 눈이 더 둥글다 (t=1.4, 문헌 방향 일치)
    eyeTilt: { mean: 3.2722, std: 1.9478 }, // 추정: 표본 차이 작음 (t=0.8)
    eyeWidth: { mean: 0.4487, std: 0.0194 }, // 추정: 표본 차이 작음 (t=1.0)
    eyeSpacing: { mean: 0.2367, std: 0.0123 }, // 추정: 표본 차이 작음 (t=0.1)
    browGap: { mean: 0.3361, std: 0.0415 }, // 여성 눈썹이 더 높다 (t=1.5, 문헌 방향 일치)
    browTilt: { mean: -8.4973, std: 2.95 }, // 추정: 표본 차이 작음 (t=-0.7)
    noseLength: { mean: 0.2599, std: 0.0134 }, // 추정: 표본 차이 작음 (t=0.2)
    noseWidth: { mean: 0.7135, std: 0.0365 }, // 남성 코가 상대적으로 넓다 (t=-1.2, 문헌 방향 일치)
    mouthWidth: { mean: 1.004, std: 0.0947 }, // 추정: 표본 차이 작음 (t=1.0)
    lipFullness: { mean: 0.2405, std: 0.0417 }, // 추정: 표본 차이 작음 (t=-0.1) — 문헌상 여성 입술이 도톰하나 이 비율 특징에서는 차이 없음
    mouthCornerLift: { mean: 0.0703, std: 0.0525 }, // 추정: 표본 차이 작음 (t=0.2)
    faceAspect: { mean: 1.1632, std: 0.0403 }, // 여성 얼굴이 더 둥글다 (t=-2.2, 문헌 방향 일치)
    jawWidth: { mean: 0.8078, std: 0.0218 }, // 추정: 표본 차이 작음 (t=-0.9)
    chinLength: { mean: 0.2051, std: 0.0182 }, // 남성 턱 끝이 길다 (t=-2.1, 문헌 방향 일치)
    midfaceRatio: { mean: 0.3883, std: 0.0166 }, // 여성 중안면 비율이 크다 (t=2.0, 문헌 방향 일치)
  },
  남: {
    eyeAspect: { mean: 0.2786, std: 0.0352 },
    eyeTilt: { mean: 2.9834, std: 1.9478 },
    eyeWidth: { mean: 0.4444, std: 0.0194 },
    eyeSpacing: { mean: 0.2367, std: 0.0123 },
    browGap: { mean: 0.3164, std: 0.0415 },
    browTilt: { mean: -8.1884, std: 2.95 },
    noseLength: { mean: 0.2599, std: 0.0134 },
    noseWidth: { mean: 0.7246, std: 0.0365 },
    mouthWidth: { mean: 0.9828, std: 0.0947 },
    lipFullness: { mean: 0.2405, std: 0.0417 },
    mouthCornerLift: { mean: 0.0702, std: 0.0525 },
    faceAspect: { mean: 1.1961, std: 0.0403 },
    jawWidth: { mean: 0.812, std: 0.0218 },
    chinLength: { mean: 0.2189, std: 0.0182 },
    midfaceRatio: { mean: 0.3765, std: 0.0166 },
  },
}

export type ZVector = Record<FeatureKey, number>

const Z_LIMIT = 3

// 표본(AI 생성 정면 얼굴)은 실제 셀카보다 고르게 정렬돼 있어 편차가 작게 잡힌다.
// 그대로 쓰면 비율이 1~2%만 달라도 z가 크게 튀어 특정 인물로 쏠릴 수 있으니 1.5배로 넓혀 쓴다.
export const STD_INFLATION = 1.5

// 사용자가 고른 성별의 기준으로 z 점수를 낸다 (공용 기준이면 여성 사용자의 z가 한쪽으로 치우친다)
export function toZ(f: FeatureVector, gender: Gender): ZVector {
  const stats = FEATURE_STATS_BY_GENDER[gender]
  const z = {} as ZVector
  for (const k of FEATURE_KEYS) {
    const { mean, std } = stats[k]
    z[k] = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, (f[k] - mean) / (std * STD_INFLATION)))
  }
  return z
}

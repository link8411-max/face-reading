import { FEATURE_KEYS, type FeatureKey, type FeatureVector } from './landmarkFeatures'

export type Gender = '남' | '여'

// 성별별 특징 평균·표준편차 (2b, 2026-10-26)
// 측정: 개발용 AI 생성 인물 사진(public/dev-faces, 실존 인물 아님) 중 성인 여 12장·남 13장을 MediaPipe로 측정
//   라벨: scripts/dev-face-genders.json, 재측정: node scripts/measure-face-stats.mjs
// 표본이 작아 성별 평균은 차이의 뚜렷함(t)만큼만 반영하고(w = t²/(1+t²)), 애매하면 공통 평균 쪽으로 당긴다.
// std는 성별 내 합동 편차로 두 성별이 같다. 실사용자 데이터가 쌓이면 다시 맞출 것.
// 바꾼 뒤에는 calibrate-samguk·calibrate-animal 스크립트를 다시 돌린다.
export const FEATURE_STATS_BY_GENDER: Record<Gender, Record<FeatureKey, { mean: number; std: number }>> = {
  여: {
    eyeAspect: { mean: 0.3056, std: 0.0373 }, // 여성 눈이 더 둥글다 (t=1.9, 문헌 방향 일치)
    eyeTilt: { mean: 4.4278, std: 2.1637 }, // 여성 눈꼬리가 더 올라간다 (t=1.8)
    eyeWidth: { mean: 0.4502, std: 0.0178 }, // 추정 (t=1.4)
    eyeSpacing: { mean: 0.2381, std: 0.0113 }, // 추정: 표본 차이 작음 (t=0.5)
    browGap: { mean: 0.3275, std: 0.0404 }, // 여성 눈썹이 더 높다 (t=1.2, 문헌 방향 일치)
    browTilt: { mean: -7.6527, std: 3.3238 }, // 추정: 표본 차이 작음 (t=0.3)
    noseLength: { mean: 0.2617, std: 0.014 }, // 추정: 표본 차이 작음 (t=0.5)
    noseWidth: { mean: 0.7119, std: 0.0344 }, // 남성 코가 상대적으로 넓다 (t=-1.3, 문헌 방향 일치)
    mouthWidth: { mean: 1.0075, std: 0.106 }, // 추정 (t=1.3)
    lipFullness: { mean: 0.251, std: 0.0557 }, // 추정: 문헌상 여성 입술이 도톰한 경향이 있으나 이 비율 특징에서는 차이 없음 (t=0.0)
    mouthCornerLift: { mean: 0.0779, std: 0.0561 }, // 추정: 표본 차이 작음 (t=0.8, 사진 표정 영향)
    faceAspect: { mean: 1.192, std: 0.0528 }, // 추정: 표본 차이 작음 (t=-0.7)
    jawWidth: { mean: 0.812, std: 0.0217 }, // 추정: 문헌상 남성 턱이 넓으나 얼굴 폭 대비 비율에서는 차이 없음 (t=0.0)
    chinLength: { mean: 0.2035, std: 0.0166 }, // 남성 턱 끝이 길다 (t=-2.5, 문헌 방향 일치)
    midfaceRatio: { mean: 0.3923, std: 0.016 }, // 여성 중안면 비율이 크다 (t=2.8)
  },
  남: {
    eyeAspect: { mean: 0.2832, std: 0.0373 },
    eyeTilt: { mean: 3.1956, std: 2.1637 },
    eyeWidth: { mean: 0.4439, std: 0.0178 },
    eyeSpacing: { mean: 0.2377, std: 0.0113 },
    browGap: { mean: 0.3159, std: 0.0404 },
    browTilt: { mean: -7.6989, std: 3.3238 },
    noseLength: { mean: 0.2613, std: 0.014 },
    noseWidth: { mean: 0.7231, std: 0.0344 },
    mouthWidth: { mean: 0.9712, std: 0.106 },
    lipFullness: { mean: 0.251, std: 0.0557 },
    mouthCornerLift: { mean: 0.0714, std: 0.0561 },
    faceAspect: { mean: 1.1966, std: 0.0528 },
    jawWidth: { mean: 0.812, std: 0.0217 },
    chinLength: { mean: 0.2181, std: 0.0166 },
    midfaceRatio: { mean: 0.3765, std: 0.016 },
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

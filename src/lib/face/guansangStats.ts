import { GUANSANG_KEYS, type GuansangKey, type GuansangFeatureVector } from './guansangFeatures'
import { STD_INFLATION, Z_LIMIT, type Gender } from './featureStats'

// 관상 특징 성별 평균·표준편차. 2026-11-07 실측 여 8장·남 12장
// (public/dev-faces 정면 사진, scripts/measure-guansang-stats.mjs. 성별 평균은 t 기반 수축, std는 합동 편차)
// 표본이 작아 |t|<2 항목은 사실상 추정이다. 실사용 데이터가 쌓이면 다시 맞출 것.
export const GUANSANG_STATS_BY_GENDER: Record<Gender, Record<GuansangKey, { mean: number; std: number }>> = {
  여: {
    cheekWidth: { mean: 0.9073, std: 0.0109 },
    jawCheekRatio: { mean: 0.8889, std: 0.0281 },
    jawAngle: { mean: 117.5599, std: 6.7364 },
    chinTaper: { mean: 0.2277, std: 0.0102 },
    foreheadWidth: { mean: 0.8219, std: 0.0259 },
    zoneUp: { mean: 0.1589, std: 0.0183 },
    zoneMid: { mean: 0.3875, std: 0.0171 },
    zoneDown: { mean: 0.4531, std: 0.0248 },
    browInnerGap: { mean: 0.8907, std: 0.0712 },
    browLength: { mean: 1.2948, std: 0.062 },
    eyeCornerToEdge: { mean: 0.2381, std: 0.0167 },
  },
  남: {
    cheekWidth: { mean: 0.9009, std: 0.0109 },
    jawCheekRatio: { mean: 0.9015, std: 0.0281 },
    jawAngle: { mean: 115.2456, std: 6.7364 },
    chinTaper: { mean: 0.2294, std: 0.0102 },
    foreheadWidth: { mean: 0.8295, std: 0.0259 },
    zoneUp: { mean: 0.1715, std: 0.0183 },
    zoneMid: { mean: 0.3759, std: 0.0171 },
    zoneDown: { mean: 0.453, std: 0.0248 },
    browInnerGap: { mean: 0.8721, std: 0.0712 },
    browLength: { mean: 1.2952, std: 0.062 },
    eyeCornerToEdge: { mean: 0.2388, std: 0.0167 },
  },
}

export type GuansangZ = Record<GuansangKey, number>

// featureStats.toZ와 같은 편차 부풀리기·클램프
export function toZGuansang(f: GuansangFeatureVector, gender: Gender): GuansangZ {
  const stats = GUANSANG_STATS_BY_GENDER[gender]
  const z = {} as GuansangZ
  for (const k of GUANSANG_KEYS) {
    const { mean, std } = stats[k]
    z[k] = Math.max(-Z_LIMIT, Math.min(Z_LIMIT, (f[k] - mean) / (std * STD_INFLATION)))
  }
  return z
}

// 가상 얼굴: 특징마다 독립 정규(±3σ 자름). zone 셋은 뽑은 뒤 합 1로 정규화.
export function sampleGuansang(rng: () => number, gender: Gender): GuansangFeatureVector {
  const stats = GUANSANG_STATS_BY_GENDER[gender]
  const f = {} as GuansangFeatureVector
  for (const k of GUANSANG_KEYS) {
    const u = Math.max(rng(), 1e-12), v = rng()
    const n = Math.max(-3, Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)))
    f[k] = stats[k].mean + n * stats[k].std
  }
  const s = f.zoneUp + f.zoneMid + f.zoneDown
  f.zoneUp /= s; f.zoneMid /= s; f.zoneDown /= s
  return f
}

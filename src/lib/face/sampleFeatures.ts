import { FEATURE_KEYS, type FeatureVector } from './landmarkFeatures'
import { FEATURE_STATS_BY_GENDER, type Gender } from './featureStats'

// 시드 고정 난수 (같은 시드면 같은 수열)
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 가상 얼굴의 특징값: 그 성별의 측정 평균·편차로 특징마다 독립 정규분포(±3σ에서 자름).
// 시뮬레이션은 이 값을 실제와 같은 toZ(f, gender)에 넣는다. 성별 기준이 섞이면 여기서 쏠림이 드러난다.
// 실제 얼굴은 특징끼리 상관이 있지만 여기선 무시한 근사다. 실사진 통계가 쌓이면 바꿀 것.
export function sampleFeatures(rng: () => number, gender: Gender): FeatureVector {
  const stats = FEATURE_STATS_BY_GENDER[gender]
  const f = {} as FeatureVector
  for (const k of FEATURE_KEYS) {
    const u = Math.max(rng(), 1e-12), v = rng()
    const n = Math.max(-3, Math.min(3, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)))
    f[k] = stats[k].mean + n * stats[k].std
  }
  return f
}

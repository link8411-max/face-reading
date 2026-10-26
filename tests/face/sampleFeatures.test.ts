import { sampleFeatures, mulberry32 } from '@/lib/face/sampleFeatures'
import { FEATURE_STATS_BY_GENDER } from '@/lib/face/featureStats'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'

// 보정 시뮬레이션은 실제 경로대로: 성별 분포에서 특징값을 뽑고 toZ(f, gender)를 거친다
test.each(['남', '여'] as const)('%s: 가상 얼굴 특징값의 평균이 그 성별 기준 평균에 가깝다', (g) => {
  const rng = mulberry32(1)
  const n = 4000
  const sums = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as Record<string, number>
  for (let i = 0; i < n; i++) { const f = sampleFeatures(rng, g); for (const k of FEATURE_KEYS) sums[k] += f[k] }
  for (const k of FEATURE_KEYS) {
    const { mean, std } = FEATURE_STATS_BY_GENDER[g][k]
    expect(Math.abs(sums[k] / n - mean), k).toBeLessThan(std * 0.1)
  }
})

import { FEATURE_STATS, toZ, STD_INFLATION } from '@/lib/face/featureStats'
import { FEATURE_KEYS, type FeatureVector, FRONTAL_YAW_LIMIT } from '@/lib/face/landmarkFeatures'

test('표본 편차를 보수적으로 키운다 (측정 3σ 차이 → z 2)', () => {
  expect(STD_INFLATION).toBe(1.5)
  const f = Object.fromEntries(FEATURE_KEYS.map((k) => [k, FEATURE_STATS[k].mean + 3 * FEATURE_STATS[k].std])) as FeatureVector
  const z = toZ(f)
  for (const k of FEATURE_KEYS) expect(z[k], k).toBeCloseTo(2, 9)
})

test('정면 판정 한계는 0.15', () => {
  expect(FRONTAL_YAW_LIMIT).toBe(0.15)
})

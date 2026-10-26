import { FEATURE_STATS_BY_GENDER, toZ, STD_INFLATION } from '@/lib/face/featureStats'
import { FEATURE_KEYS, type FeatureVector, FRONTAL_YAW_LIMIT } from '@/lib/face/landmarkFeatures'

test.each(['남', '여'] as const)('%s: 표본 편차를 보수적으로 키운다 (측정 3σ 차이 → z 2)', (g) => {
  expect(STD_INFLATION).toBe(1.5)
  const s = FEATURE_STATS_BY_GENDER[g]
  const f = Object.fromEntries(FEATURE_KEYS.map((k) => [k, s[k].mean + 3 * s[k].std])) as FeatureVector
  const z = toZ(f, g)
  for (const k of FEATURE_KEYS) expect(z[k], k).toBeCloseTo(2, 9)
})

test('정면 판정 한계는 0.15', () => {
  expect(FRONTAL_YAW_LIMIT).toBe(0.15)
})

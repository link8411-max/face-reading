import { FEATURE_STATS, toZ } from '@/lib/face/featureStats'
import { extractFeatures, FEATURE_KEYS, type FeatureVector } from '@/lib/face/landmarkFeatures'
import { makeFace } from './makeFace'

test('모집단 평균 얼굴의 z는 모두 0', () => {
  const meanFace = Object.fromEntries(FEATURE_KEYS.map((k) => [k, FEATURE_STATS[k].mean])) as FeatureVector
  const z = toZ(meanFace)
  for (const k of FEATURE_KEYS) expect(Math.abs(z[k]), k).toBeLessThan(1e-9)
})

test('극단값은 ±3으로 잘린다', () => {
  const f = extractFeatures(makeFace())
  const z = toZ({ ...f, faceAspect: 99, eyeTilt: -99 })
  expect(z.faceAspect).toBe(3)
  expect(z.eyeTilt).toBe(-3)
})

test('std는 모두 양수', () => {
  for (const k of FEATURE_KEYS) expect(FEATURE_STATS[k].std, k).toBeGreaterThan(0)
})

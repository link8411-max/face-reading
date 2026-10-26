import { FEATURE_STATS, toZ } from '@/lib/face/featureStats'
import { extractFeatures, FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import { makeFace } from './makeFace'

test('기본 얼굴의 z는 모두 0 근처', () => {
  const z = toZ(extractFeatures(makeFace()))
  for (const k of FEATURE_KEYS) expect(Math.abs(z[k]), k).toBeLessThan(0.05)
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

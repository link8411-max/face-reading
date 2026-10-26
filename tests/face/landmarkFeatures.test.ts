import { extractFeatures, checkFrontal, FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import { makeFace } from './makeFace'

test('크기·이동·회전(roll)에 불변', () => {
  const a = extractFeatures(makeFace())
  const b = extractFeatures(makeFace({ scale: 2.5, dx: 120, dy: 40, rotateDeg: 15 }))
  for (const k of FEATURE_KEYS) expect(Math.abs(a[k] - b[k]), k).toBeLessThan(1e-6)
})

test('눈꼬리를 올리면 eyeTilt 증가', () => {
  const base = extractFeatures(makeFace())
  const up = extractFeatures(makeFace({ edit: (p) => { p[33][1] -= 5; p[263][1] -= 5 } }))
  expect(up.eyeTilt).toBeGreaterThan(base.eyeTilt)
})

test('입꼬리를 올리면 mouthCornerLift 증가', () => {
  const base = extractFeatures(makeFace())
  const up = extractFeatures(makeFace({ edit: (p) => { p[61][1] -= 4; p[291][1] -= 4 } }))
  expect(up.mouthCornerLift).toBeGreaterThan(base.mouthCornerLift)
})

test('얼굴을 세로로 늘리면 faceAspect 증가', () => {
  const base = extractFeatures(makeFace())
  const long = extractFeatures(makeFace({ edit: (p) => { p[10][1] -= 15; p[152][1] += 15 } }))
  expect(long.faceAspect).toBeGreaterThan(base.faceAspect)
})

test('checkFrontal: 정면 ok, 코끝이 한쪽으로 30% 치우치면 ok=false', () => {
  expect(checkFrontal(makeFace()).ok).toBe(true)
  const turned = checkFrontal(makeFace({ edit: (p) => { p[1][0] += 0.3 * 140 } }))
  expect(turned.ok).toBe(false)
  expect(turned.yawRatio).toBeGreaterThan(0.12)
})

test('FEATURE_KEYS 15개 모두 유한한 숫자', () => {
  const f = extractFeatures(makeFace())
  expect(FEATURE_KEYS).toHaveLength(15)
  for (const k of FEATURE_KEYS) expect(Number.isFinite(f[k]), k).toBe(true)
})

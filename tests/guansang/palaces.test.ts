import { readPalaces } from '@/lib/face/palaces'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import { GUANSANG_KEYS } from '@/lib/face/guansangFeatures'
import { PALACE_KEYS } from '@/lib/face/guansangKeys'

// 다섯 자리 z가 모두 v가 되도록 입력을 만든다 (base는 -jawAngle을 쓰므로 jawAngle은 -v)
function all(v: number, forehead = true) {
  const z = Object.fromEntries(FEATURE_KEYS.map((k) => [k, v])) as any
  const g = Object.fromEntries(GUANSANG_KEYS.map((k) => [k, v])) as any
  g.jawAngle = -v
  return readPalaces(z, g, forehead)
}
const count = (r: ReturnType<typeof all>, l: string) => r.filter((p) => p.label === l).length

test('다섯 자리 순서 고정', () => {
  expect(all(0).map((p) => p.key)).toEqual([...PALACE_KEYS])
})
test('전부 -1: 두드러진 정확히 1, 가꿀수록 2', () => {
  const r = all(-1)
  expect(count(r, 'strong')).toBe(1)
  expect(count(r, 'grow')).toBe(2)
})
test('전부 +1: 두드러진 5, 가꿀수록 0', () => {
  const r = all(1)
  expect(count(r, 'strong')).toBe(5)
  expect(count(r, 'grow')).toBe(0)
})
test('전부 0: 두드러진 1 이상, 가꿀수록 2 이하', () => {
  const r = all(0)
  expect(count(r, 'strong')).toBeGreaterThanOrEqual(1)
  expect(count(r, 'grow')).toBeLessThanOrEqual(2)
})
test('이마 불확실이면 work z는 0', () => {
  expect(all(1, false).find((p) => p.key === 'work')!.z).toBe(0)
})

import { classifyGuansang, SHAPE_PROFILES, type GuansangInput, type Calibration } from '@/lib/face/guansang'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import { GUANSANG_KEYS } from '@/lib/face/guansangFeatures'
import { SHAPE_KEYS } from '@/lib/face/guansangKeys'

const zero = (keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<string, number>
const ZERO_CAL: Calibration = { seed: 1, n: 1, shapeBias: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }, zoneBias: { up: 0, mid: 0, down: 0 } }
const MID_ZONES = { up: 0.16, mid: 0.38, down: 0.46 }

function input(shapeZ: Record<string, number> = {}, zoneZ = [0, 0, 0], zones = MID_ZONES): GuansangInput {
  const z = zero(FEATURE_KEYS), g = zero(GUANSANG_KEYS)
  for (const [k, v] of Object.entries(shapeZ)) { if (k in z) z[k] = v; else g[k] = v }
  g.zoneUp = zoneZ[0]; g.zoneMid = zoneZ[1]; g.zoneDown = zoneZ[2]
  return { z, g, zones } as unknown as GuansangInput
}

test.each(SHAPE_KEYS)('프로토타입 %s를 그대로 넣으면 그 얼굴형', (s) => {
  expect(classifyGuansang(input(SHAPE_PROFILES[s]), ZERO_CAL).shape).toBe(s)
})

test('센 자리는 구간 z로 정한다', () => {
  expect(classifyGuansang(input({}, [1.5, 0, 0]), ZERO_CAL).zone).toBe('up')
  expect(classifyGuansang(input({}, [0, 1.2, 0]), ZERO_CAL).zone).toBe('mid')
  expect(classifyGuansang(input({}, [0, 0, 1.2]), ZERO_CAL).zone).toBe('down')
})

test('이마가 범위 밖이면 추정 표시하고 up을 뽑지 않는다', () => {
  const r = classifyGuansang(input({}, [2, 0, 0], { up: 0.15 - 0.05, mid: 0.4, down: 0.55 }), ZERO_CAL)
  expect(r.foreheadUncertain).toBe(true)
  expect(r.zone).not.toBe('up')
  expect(classifyGuansang(input({}, [2, 0, 0], { up: 0.25, mid: 0.35, down: 0.4 }), ZERO_CAL).foreheadUncertain).toBe(true)
  expect(classifyGuansang(input({}, [2, 0, 0]), ZERO_CAL).foreheadUncertain).toBe(false)
})

test('balanced는 세 구간 z의 max-min이 0.6 이하', () => {
  expect(classifyGuansang(input({}, [0.1, -0.1, 0.2]), ZERO_CAL).balanced).toBe(true)
  expect(classifyGuansang(input({}, [1.2, -0.3, 0]), ZERO_CAL).balanced).toBe(false)
})

test('같은 입력은 같은 결과, type은 shape-zone', () => {
  const a = classifyGuansang(input(SHAPE_PROFILES.metal, [0, 1, 0]), ZERO_CAL)
  expect(classifyGuansang(input(SHAPE_PROFILES.metal, [0, 1, 0]), ZERO_CAL)).toEqual(a)
  expect(a.type).toBe(`${a.shape}-${a.zone}`)
  expect(a.palaces).toHaveLength(5)
})

test('이마 불확실이면 자리 판독의 work는 0', () => {
  const r = classifyGuansang(input({}, [3, 0, 0], { up: 0.05, mid: 0.4, down: 0.55 }), ZERO_CAL)
  expect(r.palaces.find((p) => p.key === 'work')!.z).toBe(0)
})

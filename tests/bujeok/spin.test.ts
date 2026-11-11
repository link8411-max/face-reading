import { expect, test } from 'vitest'
import { HINT, hintAngle, hintRy, ZOOM, clampZoom, pinchZoom, restFace, sheenPos, stepSpin, type SpinState } from '@/lib/bujeok/spin'

const run = (s: SpinState, n: number, dragging = false) => {
  for (let i = 0; i < n; i++) s = stepSpin(s, dragging)
  return s
}

test('끌지 않으면 200프레임 뒤 ry는 180의 배수에서 0.5도 안, vy는 0에 수렴', () => {
  for (const start of [{ ry: 100, vy: 0, rx: 8 }, { ry: 20, vy: 18, rx: 0 }, { ry: -300, vy: -12, rx: -10 }, { ry: 0, vy: 40, rx: 0 }]) {
    const s = run(start, 200)
    expect(Math.abs(s.ry - Math.round(s.ry / 180) * 180)).toBeLessThan(0.5)
    expect(Math.abs(s.vy)).toBeLessThan(0.01)
    expect(Math.abs(s.rx)).toBeLessThan(0.01)
  }
})

test('끄는 중에는 ry·vy를 건드리지 않는다', () => {
  const s: SpinState = { ry: 33, vy: 9, rx: 5 }
  const n = stepSpin(s, true)
  expect(n.ry).toBe(33)
  expect(n.vy).toBe(9)
})

test('restFace', () => {
  expect(restFace(0)).toBe('front')
  expect(restFace(170)).toBe('back')
  expect(restFace(-190)).toBe('back')
  expect(restFace(350)).toBe('front')
})

test('sheenPos는 항상 0~100', () => {
  for (let ry = -1000; ry <= 1000; ry += 7.3) {
    const p = sheenPos(ry)
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThanOrEqual(100)
  }
  expect(sheenPos(Number.NaN)).toBeGreaterThanOrEqual(0)
})

test('clampZoom', () => {
  expect(ZOOM).toEqual({ min: 0.7, max: 2, step: 0.25 })
  expect(clampZoom(0.1)).toBe(0.7)
  expect(clampZoom(9)).toBe(2)
  expect(clampZoom(Number.NaN)).toBe(1)
  expect(clampZoom(1.3)).toBe(1.3)
})

test('pinchZoom', () => {
  expect(pinchZoom(1, 100, 150)).toBe(1.5)
  expect(pinchZoom(1, 100, 1000)).toBe(2)
  expect(pinchZoom(1, 0, 50)).toBe(1)
  expect(pinchZoom(2, 100, 10)).toBe(0.7)
})

test('hintAngle: 0에서 시작해 0으로 돌아오고, 36도를 넘지 않고, 끝나면 null', () => {
  expect(hintAngle(0)).toBe(0)
  expect(HINT.ms).toBe(2400)
  expect(Math.abs(hintAngle(HINT.ms - 1)!)).toBeLessThan(0.5)
  expect(hintAngle(HINT.ms)).toBeNull()
  expect(hintAngle(HINT.ms + 5000)).toBeNull()
  let max = 0
  let sign = 0
  let crossings = 0
  for (let t = 0; t < HINT.ms; t += 4) {
    const a = hintAngle(t)!
    max = Math.max(max, Math.abs(a))
    const sg = Math.sign(a)
    if (sg !== 0 && sign !== 0 && sg !== sign) crossings++
    if (sg !== 0) sign = sg
  }
  expect(max).toBeLessThanOrEqual(36)
  expect(max).toBeGreaterThan(30) // 눈에 띄게 돌아간다
  expect(crossings).toBeGreaterThanOrEqual(5) // 세 번 흔들림(좌우 여섯 번 방향 바뀜 중 가운데 다섯 번 이상)
})

test('hintRy: 첫 흔들기 → 가만히 → 6초 뒤 한 번 더 → 끝(null)', () => {
  expect(hintRy(0)).toBe(0)
  expect(Math.abs(hintRy(300)!)).toBeGreaterThan(1)
  expect(hintRy(HINT.ms + 100)).toBe(0)
  expect(hintRy(HINT.repeatAt - 1)).toBe(0)
  expect(HINT.repeatAt).toBe(6000)
  expect(Math.abs(hintRy(HINT.repeatAt + 300)!)).toBeGreaterThan(1)
  expect(hintRy(HINT.repeatAt + HINT.ms)).toBeNull()
  expect(hintRy(60000)).toBeNull()
})

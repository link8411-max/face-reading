import { expect, test } from 'vitest'
import { brush, type Pt } from '@/lib/bujeok/brush'
import { DEFAULT_SPINE, SPINE_W, decodeStroke, encodeStroke, isComplete, resample, tame } from '@/lib/bujeok/stroke'

const HAND: Pt[] = [[122, 256], [125, 280], [118, 320], [123, 360], [117, 400], [120, 430], [108, 448], [95, 438]]

test('인코딩은 25자이고 정규식에 맞는다', () => {
  for (const p of [DEFAULT_SPINE, HAND]) {
    const s = encodeStroke(p)
    expect(s).toHaveLength(25)
    expect(s).toMatch(/^s[0-9a-z]{24}$/)
  }
})

test('왕복 오차: x 1 이하, y 3 이하', () => {
  for (const p of [DEFAULT_SPINE, HAND]) {
    const a = resample(p, 12)
    const b = decodeStroke(encodeStroke(p))!
    expect(b).toHaveLength(12)
    a.forEach(([x, y], i) => {
      expect(Math.abs(x - b[i][0])).toBeLessThanOrEqual(1.0001)
      expect(Math.abs(y - b[i][1])).toBeLessThanOrEqual(3.0001)
    })
  }
})

test('잘못된 문자열은 null', () => {
  for (const s of ['', 's', 'x' + '0'.repeat(24), 's' + '0'.repeat(23), 's' + '0'.repeat(25), 's' + 'A'.repeat(24), 's' + '-'.repeat(24)]) expect(decodeStroke(s)).toBeNull()
})

test('isComplete: 기본 획은 true, 짧은·위로 그은·화면 밖 획은 false', () => {
  expect(isComplete(DEFAULT_SPINE)).toBe(true)
  expect(isComplete(HAND)).toBe(true)
  expect(isComplete(DEFAULT_SPINE.slice(0, 4))).toBe(false) // 점 부족
  expect(isComplete([[120, 254], [120, 280], [120, 300], [120, 320], [120, 340], [120, 360]])).toBe(false) // 짧다
  expect(isComplete([...HAND].reverse())).toBe(false) // 위로 그음
  expect(isComplete([...HAND.slice(0, 7), [300, 440]])).toBe(false) // 화면 밖 x
  expect(isComplete([...HAND.slice(0, 7), [120, 600]])).toBe(false) // 화면 밖 y
})

test('tame: 위쪽은 가운데로 당기고 아래 꺾임은 그대로', () => {
  expect(tame([200, 300])).toEqual([134, 300])
  expect(tame([100, 300])).toEqual([112, 300])
  expect(tame([90, 440])).toEqual([90, 440])
})

test('brush는 같은 입력에 같은 문자열', () => {
  const a = brush(DEFAULT_SPINE, SPINE_W, { seed: 99, start: 0.6, end: 0.12 })
  expect(a).toBe(brush(DEFAULT_SPINE, SPINE_W, { seed: 99, start: 0.6, end: 0.12 }))
  expect(a.startsWith('M')).toBe(true)
  expect(a).not.toBe(brush(DEFAULT_SPINE, SPINE_W, { seed: 98, start: 0.6, end: 0.12 }))
})

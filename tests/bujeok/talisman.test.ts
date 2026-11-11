import { expect, test } from 'vitest'
import { EL_KEYS, WISHES } from '@/lib/bujeok/keys'
import { bottomStrokes, elementStrokes, symbolStrokes, talismanStrokes, topStrokes } from '@/lib/bujeok/talisman'

test('소원마다 상징 획이 다르고, 기운마다 가운데 획이 다르다', () => {
  expect(new Set(WISHES.map((w) => JSON.stringify(symbolStrokes(w)))).size).toBe(WISHES.length)
  expect(new Set(EL_KEYS.map((e) => JSON.stringify(elementStrokes(e)))).size).toBe(EL_KEYS.length)
})

test('상징은 종이 안, 가운데 x=120 둘레(76~164)에 있고 y 258~350에 놓인다', () => {
  for (const w of WISHES) {
    const pts = symbolStrokes(w).flatMap((s) => s.pts)
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    expect(Math.min(...xs), w).toBeGreaterThanOrEqual(76)
    expect(Math.max(...xs), w).toBeLessThanOrEqual(164)
    expect(Math.min(...ys), w).toBeGreaterThanOrEqual(256)
    expect(Math.max(...ys), w).toBeLessThanOrEqual(356)
    expect((Math.min(...xs) + Math.max(...xs)) / 2, w).toBeGreaterThan(112)
    expect((Math.min(...xs) + Math.max(...xs)) / 2, w).toBeLessThan(128)
  }
})

test('전체 획은 공통 위·기운·상징·공통 아래 순서이고 몸통은 들어 있지 않다', () => {
  const all = talismanStrokes({ el: 'fire', wish: 'pass' })
  expect(all).toHaveLength(topStrokes().length + elementStrokes('fire').length + symbolStrokes('pass').length + bottomStrokes().length)
  for (const s of all) for (const [x, y] of s.pts) {
    expect(x).toBeGreaterThanOrEqual(20)
    expect(x).toBeLessThanOrEqual(220)
    expect(y).toBeGreaterThanOrEqual(90)
    expect(y).toBeLessThanOrEqual(450)
  }
})

test('취업·승진 계단은 몸통(가운데 x 113~127)을 비켜 왼쪽 아래에서 오른쪽 위로 오른다', async () => {
  const { symbolStrokes } = await import('@/lib/bujeok/talisman')
  const st = symbolStrokes('career')
  const pts = st.flatMap((s) => s.pts)
  expect(pts.every(([x]) => x < 113 || x > 127)).toBe(true)
  expect(st.every((s) => s.w >= 6 * 1.75)).toBe(true) // 굵은 획
  const first = st[0].pts[0]
  const last = st[st.length - 1].pts.at(-1)!
  expect(last[0]).toBeGreaterThan(first[0])
  expect(last[1]).toBeLessThan(first[1])
})

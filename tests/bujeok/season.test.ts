import { expect, test } from 'vitest'
import { seasonDefaultWish } from '@/lib/bujeok/season'

test('11/1~11/20(한국 시간)은 합격, 그 밖은 재물', () => {
  expect(seasonDefaultWish(new Date('2026-11-11T03:00:00Z'))).toBe('pass')
  expect(seasonDefaultWish(new Date('2026-11-01T00:00:00+09:00'))).toBe('pass')
  expect(seasonDefaultWish(new Date('2026-11-20T23:59:00+09:00'))).toBe('pass')
  expect(seasonDefaultWish(new Date('2026-11-21T00:00:00+09:00'))).toBe('money')
  expect(seasonDefaultWish(new Date('2026-03-01T12:00:00+09:00'))).toBe('money')
  expect(seasonDefaultWish(new Date('2026-10-31T23:59:00+09:00'))).toBe('money')
})

test('UTC로는 10/31이어도 한국 시간 11/1이면 합격', () => {
  expect(seasonDefaultWish(new Date('2026-10-31T16:00:00Z'))).toBe('pass')
})

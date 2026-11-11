import { expect, test } from 'vitest'
import { WALLPAPER, wallpaperLayout } from '@/lib/bujeok/wallpaper'

test('잠금화면 크기는 1170×2532', () => {
  expect(WALLPAPER).toEqual({ w: 1170, h: 2532 })
})

test('부적 자리는 위 3분의 1 아래에서 시작하고 화면 안에 들어간다', () => {
  const l = wallpaperLayout()
  expect(l.y).toBeGreaterThanOrEqual(WALLPAPER.h / 3)
  expect(l.x).toBeGreaterThanOrEqual(0)
  expect(l.x + l.w).toBeLessThanOrEqual(WALLPAPER.w)
  expect(l.y + l.h).toBeLessThanOrEqual(WALLPAPER.h)
})

test('부적 자리는 그림 비율(300:520)을 지키고 가운데에 놓인다', () => {
  const l = wallpaperLayout()
  expect(l.h / l.w).toBeCloseTo(520 / 300, 3)
  expect(l.x * 2 + l.w).toBe(WALLPAPER.w)
})

test('아래 워터마크가 들어갈 여백이 남는다', () => {
  const l = wallpaperLayout()
  expect(WALLPAPER.h - (l.y + l.h)).toBeGreaterThanOrEqual(120)
})

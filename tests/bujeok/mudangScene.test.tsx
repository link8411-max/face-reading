// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))

import MudangScene, { FLASH_MS, RiteFlashOut, MAX_MS, SCENE_POSTER, SCENE_VIDEO, START_TIMEOUT_MS, shouldPlayScene } from '@/components/bujeok/MudangScene'
import BujeokClient from '@/components/bujeok/BujeokClient'
import { installStorage, restoreStorage } from '../exam/storageStub'

const setReduce = (reduce: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  installStorage()
  vi.useFakeTimers()
  setReduce(false)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  restoreStorage()
})

test('영상·포스터 파일이 있고 가볍다(영상 1MB 이하, 소리 없는 한 편)', () => {
  const v = `public${SCENE_VIDEO}`
  const p = `public${SCENE_POSTER}`
  expect(existsSync(v)).toBe(true)
  expect(existsSync(p)).toBe(true)
  expect(statSync(v).size).toBeLessThan(1_000_000)
  expect(statSync(p).size).toBeLessThan(120_000)
})

test('건너뛰기 버튼이 없고, 포스터가 바로 보이며, 소리 없이 한 번 재생한다(반복 없음)', () => {
  render(<MudangScene onDone={() => {}} />)
  const v = screen.getByTestId('mudang-scene').querySelector('video')!
  expect(v.getAttribute('poster')).toBe(SCENE_POSTER)
  expect(v.muted).toBe(true)
  expect(v.hasAttribute('loop')).toBe(false)
  expect(v.hasAttribute('playsinline')).toBe(true)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.getByTestId('mudang-scene').textContent).toContain('정성껏 담아 그려 드릴게요')
})

test('재생이 끝나면 화면 전체가 번쩍한 뒤 한 번만 onDone(번쩍임 있음)', () => {
  const onDone = vi.fn()
  render(<MudangScene onDone={onDone} />)
  const v = screen.getByTestId('mudang-scene').querySelector('video')!
  fireEvent(v, new Event('playing'))
  act(() => vi.advanceTimersByTime(START_TIMEOUT_MS + 100)) // 재생이 시작됐으니 시작 시간 초과로 넘어가지 않는다
  expect(onDone).not.toHaveBeenCalled()
  expect(screen.queryByTestId('rite-flash')).toBeNull()
  fireEvent(v, new Event('ended'))
  expect(screen.getByTestId('rite-flash').className).toContain('fixed')
  act(() => vi.advanceTimersByTime(FLASH_MS))
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(onDone).toHaveBeenCalledWith(true)
  act(() => vi.advanceTimersByTime(MAX_MS))
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('영상 오류면 바로, 재생이 시작되지 않으면 시작 시간 초과에 넘어간다', () => {
  const a = vi.fn()
  render(<MudangScene onDone={a} />)
  fireEvent(screen.getByTestId('mudang-scene').querySelector('video')!, new Event('error'))
  expect(a).toHaveBeenCalledWith(false) // 번쩍임 없이
  cleanup()
  const b = vi.fn()
  render(<MudangScene onDone={b} />)
  act(() => vi.advanceTimersByTime(START_TIMEOUT_MS))
  expect(b).toHaveBeenCalledTimes(1)
})

test('움직임 줄이기·데이터 절약이면 장면을 건너뛴다', () => {
  expect(shouldPlayScene()).toBe(true)
  setReduce(true)
  expect(shouldPlayScene()).toBe(false)
  setReduce(false)
  Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
  expect(shouldPlayScene()).toBe(false)
  Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true })
})

test('부적 화면 순서: form → 무당 장면 → 점안, 장면에는 건너뛰기가 없다', () => {
  render(<BujeokClient />)
  fireEvent.click(screen.getByRole('button', { name: /이 부적 받기/ }))
  expect(screen.getByTestId('mudang-scene')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /건너뛰기/ })).toBeNull()
  fireEvent(screen.getByTestId('mudang-scene').querySelector('video')!, new Event('error'))
  expect(screen.queryByTestId('mudang-scene')).toBeNull()
  expect(screen.getByRole('button', { name: '그냥 완성하기' })).toBeTruthy()
  expect(screen.queryByTestId('rite-flash-out')).toBeNull() // 영상 오류면 번쩍임도 없다
})

test('영상이 끝나 번쩍이면 점안 화면이 그 빛이 걷히며 나타나고, 빛은 0.8초 뒤 사라진다', () => {
  render(<BujeokClient />)
  fireEvent.click(screen.getByRole('button', { name: /이 부적 받기/ }))
  const v = screen.getByTestId('mudang-scene').querySelector('video')!
  fireEvent(v, new Event('playing'))
  fireEvent(v, new Event('ended'))
  act(() => vi.advanceTimersByTime(FLASH_MS))
  expect(screen.getByRole('button', { name: '그냥 완성하기' })).toBeTruthy()
  expect(screen.getByTestId('rite-flash-out')).toBeTruthy()
  act(() => vi.advanceTimersByTime(800))
  expect(screen.queryByTestId('rite-flash-out')).toBeNull()
})

test('RiteFlashOut은 부모가 다시 그려도 시간을 다시 재지 않는다', () => {
  const gone = vi.fn()
  const { rerender } = render(<RiteFlashOut onGone={() => gone()} />)
  act(() => vi.advanceTimersByTime(500))
  rerender(<RiteFlashOut onGone={() => gone()} />)
  act(() => vi.advanceTimersByTime(300))
  expect(gone).toHaveBeenCalledTimes(1)
})

test('움직임 줄이기면 장면 없이 바로 점안', () => {
  setReduce(true)
  render(<BujeokClient />)
  fireEvent.click(screen.getByRole('button', { name: /이 부적 받기/ }))
  expect(screen.queryByTestId('mudang-scene')).toBeNull()
  expect(screen.getByRole('button', { name: '그냥 완성하기' })).toBeTruthy()
})

test('선물 받는 착지에는 무당 장면이 없다', () => {
  expect(readFileSync('src/components/bujeok/GiftLanding.tsx', 'utf8')).not.toContain('MudangScene')
})

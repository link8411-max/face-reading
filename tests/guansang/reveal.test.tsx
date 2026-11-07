// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import RevealMotion, { coverTransform } from '@/components/face/RevealMotion'
import { revealPlan, STEP_MS, REVEAL_STEPS } from '@/lib/face/revealTimeline'
import { fakeLandmarks } from './fakeLandmarks'
import type { PalaceResult } from '@/lib/face/palaces'

const palaces: PalaceResult[] = [
  { key: 'money', label: 'strong', z: 1 },
  { key: 'work', label: 'even', z: 0 },
  { key: 'love', label: 'grow', z: -1 },
  { key: 'people', label: 'even', z: 0 },
  { key: 'base', label: 'even', z: 0 },
]
const zones = { up: 0.3, mid: 0.33, down: 0.37 }

function props(over: Partial<React.ComponentProps<typeof RevealMotion>> = {}) {
  return { imageUrl: 'data:image/png;base64,AA==', landmarks: fakeLandmarks(), zones, dominant: 'down' as const, palaces, onDone: vi.fn(), ...over }
}

const ctxStub = new Proxy({}, { get: (t: any, k) => (k in t ? t[k] : () => {}), set: (t: any, k, v) => { t[k] = v; return true } })

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctxStub as any)
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('revealPlan', () => {
  it('기본은 네 단계 전부', () => {
    expect(revealPlan({ reducedMotion: false, hasLandmarks: true })).toEqual([...REVEAL_STEPS])
  })
  it('reducedMotion이면 card만', () => {
    expect(revealPlan({ reducedMotion: true, hasLandmarks: true })).toEqual(['card'])
  })
  it('랜드마크가 없으면 card만', () => {
    expect(revealPlan({ reducedMotion: false, hasLandmarks: false })).toEqual(['card'])
  })
})

describe('coverTransform', () => {
  it('가로로 긴 사진은 높이에 맞추고 좌우를 자른다', () => {
    const t = coverTransform(800, 400)
    expect(t.s).toBeCloseTo(488 / 400)
    expect(t.px(0.5)).toBeCloseTo(195)
    expect(t.py(0)).toBeCloseTo(0)
  })
})

describe('RevealMotion', () => {
  it('건너뛰기를 누르면 onDone이 한 번만 불린다', () => {
    const p = props()
    render(<RevealMotion {...p} />)
    const btn = screen.getByText('건너뛰기')
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(p.onDone).toHaveBeenCalledTimes(1)
  })

  it('랜드마크가 없으면 바로 onDone', () => {
    const p = props({ landmarks: null })
    render(<RevealMotion {...p} />)
    expect(p.onDone).toHaveBeenCalledTimes(1)
  })

  it('전체 계획은 STEP_MS 합계 뒤에 onDone', () => {
    vi.useFakeTimers()
    const total = REVEAL_STEPS.reduce((s, k) => s + STEP_MS[k], 0)
    const p = props()
    render(<RevealMotion {...p} />)
    act(() => { vi.advanceTimersByTime(total - 1) })
    expect(p.onDone).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(1) })
    expect(p.onDone).toHaveBeenCalledTimes(1)
  })

  it('언마운트하면 타이머가 취소된다', () => {
    vi.useFakeTimers()
    const p = props()
    const { unmount } = render(<RevealMotion {...p} />)
    unmount()
    act(() => { vi.advanceTimersByTime(10000) })
    expect(p.onDone).not.toHaveBeenCalled()
  })

  it('단계 설명 문구가 단계별로 바뀐다', () => {
    vi.useFakeTimers()
    render(<RevealMotion {...props()} />)
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByText('얼굴 기준점 478개를 재고 있어요')).toBeTruthy()
    act(() => { vi.advanceTimersByTime(STEP_MS.dots) })
    expect(screen.getByText('이마·코·턱 세 구간의 비율을 봐요')).toBeTruthy()
  })
})

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { pickGender, guessGender, GUESS_MIN_PROB, GUESS_TIMEOUT_MS } from '@/lib/face/genderGuess'
import { useGenderGuess } from '@/hooks/useGenderGuess'

const img = {} as HTMLImageElement

describe('pickGender', () => {
  it('확신 경계', () => {
    expect(GUESS_MIN_PROB).toBe(0.6)
    expect(pickGender({ gender: 'male', probability: 0.59 })).toBeNull()
    expect(pickGender({ gender: 'male', probability: 0.6 })).toBe('남')
    expect(pickGender({ gender: 'female', probability: 0.9 })).toBe('여')
    expect(pickGender(null)).toBeNull()
  })
})

describe('guessGender', () => {
  it('성공하면 값', async () => {
    const detect = async () => ({ gender: 'female' as const, probability: 0.8 })
    expect(await guessGender(img, { detect })).toBe('여')
  })
  it('확신이 낮으면 null', async () => {
    const detect = async () => ({ gender: 'female' as const, probability: 0.5 })
    expect(await guessGender(img, { detect })).toBeNull()
  })
  it('detect가 거부하면 null', async () => {
    const detect = async () => {
      throw new Error('boom')
    }
    expect(await guessGender(img, { detect })).toBeNull()
  })
  it('제한 시간(4초)을 넘기면 null', async () => {
    vi.useFakeTimers()
    try {
      expect(GUESS_TIMEOUT_MS).toBe(4000)
      const detect = () =>
        new Promise<{ gender: 'male'; probability: number }>((r) =>
          setTimeout(() => r({ gender: 'male', probability: 0.99 }), 4100),
        )
      const p = guessGender(img, { detect })
      await vi.advanceTimersByTimeAsync(4100)
      expect(await p).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
  it('성공하면 타이머를 남기지 않는다', async () => {
    vi.useFakeTimers()
    try {
      const detect = async () => ({ gender: 'male' as const, probability: 0.9 })
      await guessGender(img, { detect })
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('useGenderGuess', () => {
  it('current가 있으면 추정하지 않는다', () => {
    const guess = vi.fn(async () => '여' as const)
    const set = vi.fn()
    renderHook(() => useGenderGuess('a.jpg', '남', set, guess))
    expect(guess).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })
  it('image가 없으면 추정하지 않는다', () => {
    const guess = vi.fn(async () => '여' as const)
    renderHook(() => useGenderGuess(null, null, vi.fn(), guess))
    expect(guess).not.toHaveBeenCalled()
  })
  it('비어 있으면 한 번 추정해 채운다', async () => {
    const guess = vi.fn(async () => '여' as const)
    const set = vi.fn()
    const { rerender } = renderHook(({ cur }) => useGenderGuess('a.jpg', cur, set, guess), {
      initialProps: { cur: null as '남' | '여' | null },
    })
    await act(async () => {})
    expect(guess).toHaveBeenCalledTimes(1)
    expect(set).toHaveBeenCalledWith('여')
    rerender({ cur: null })
    await act(async () => {})
    expect(guess).toHaveBeenCalledTimes(1)
  })
  it('그 사이 사용자가 고른 값은 덮어쓰지 않는다', async () => {
    let resolve!: (g: '여') => void
    const guess = vi.fn(() => new Promise<'여'>((r) => (resolve = r)))
    const set = vi.fn()
    const { rerender } = renderHook(({ cur }) => useGenderGuess('a.jpg', cur, set, guess), {
      initialProps: { cur: null as '남' | '여' | null },
    })
    rerender({ cur: '남' })
    await act(async () => resolve('여'))
    expect(set).not.toHaveBeenCalled()
  })
  it('null 결과면 건드리지 않는다', async () => {
    const set = vi.fn()
    renderHook(() => useGenderGuess('a.jpg', null, set, async () => null))
    await act(async () => {})
    expect(set).not.toHaveBeenCalled()
  })
})

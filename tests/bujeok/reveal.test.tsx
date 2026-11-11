// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BujeokReveal from '@/components/bujeok/BujeokReveal'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 0 }

interface FakeAnim { cancel: ReturnType<typeof vi.fn>; finished: Promise<unknown>; finish: () => void; cancelled: boolean }
let anims: FakeAnim[] = []

beforeEach(() => {
  anims = []
  Element.prototype.animate = function () {
    let resolve!: (v?: unknown) => void
    let reject!: (e?: unknown) => void
    const finished = new Promise((res, rej) => { resolve = res; reject = rej })
    finished.catch(() => {})
    const a: FakeAnim = {
      cancelled: false,
      finished,
      finish: () => resolve(),
      cancel: vi.fn(() => { a.cancelled = true; reject(new DOMException('cancel', 'AbortError')) }),
    }
    anims.push(a)
    return a as unknown as Animation
  } as unknown as typeof Element.prototype.animate
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  // @ts-expect-error 시험용 제거
  delete Element.prototype.animate
})

test('마운트하면 [data-a] 요소마다 애니메이션이 걸린다', () => {
  const { container } = render(<BujeokReveal spec={spec} name="민지" playKey={0} />)
  expect(anims.length).toBe(container.querySelectorAll('[data-a]').length)
  expect(anims.length).toBeGreaterThan(10)
})

test('건너뛰기를 누르면 onDone이 한 번 불리고 완성 상태가 된다', async () => {
  const onDone = vi.fn()
  const { getByTestId, queryByTestId } = render(<BujeokReveal spec={spec} name="민지" playKey={0} onDone={onDone} />)
  await act(async () => { fireEvent.click(getByTestId('bujeok-skip')) })
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(anims.every((a) => a.cancelled)).toBe(true)
  // 늦게 도착한 finished 신호로 또 불리지 않는다
  await act(async () => { await Promise.resolve() })
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(queryByTestId('bujeok-skip')).toBeNull()
})

test('끝까지 그려지면 onDone이 한 번 불린다', async () => {
  const onDone = vi.fn()
  render(<BujeokReveal spec={spec} name="민지" playKey={0} onDone={onDone} />)
  await act(async () => { anims.forEach((a) => a.finish()); await Promise.resolve() })
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('playKey를 연달아 세 번 바꿔도 진행 중인 애니메이션이 모두 취소되고 onDone은 마지막 것만 한 번', async () => {
  const onDone = vi.fn()
  const { rerender } = render(<BujeokReveal spec={spec} name="민지" playKey={0} onDone={onDone} />)
  const n = anims.length
  rerender(<BujeokReveal spec={spec} name="민지" playKey={1} onDone={onDone} />)
  rerender(<BujeokReveal spec={spec} name="민지" playKey={2} onDone={onDone} />)
  rerender(<BujeokReveal spec={spec} name="민지" playKey={3} onDone={onDone} />)
  expect(anims.length).toBe(n * 4)
  const old = anims.slice(0, n * 3)
  expect(old.every((a) => a.cancelled)).toBe(true)
  expect(anims.slice(n * 3).some((a) => a.cancelled)).toBe(false)
  await act(async () => { anims.slice(n * 3).forEach((a) => a.finish()); await Promise.resolve() })
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('prefers-reduced-motion이면 애니메이션 없이 즉시 onDone', async () => {
  window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
  const onDone = vi.fn()
  const { queryByTestId } = render(<BujeokReveal spec={spec} name="민지" playKey={0} onDone={onDone} />)
  await act(async () => { await Promise.resolve() })
  expect(anims).toHaveLength(0)
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(queryByTestId('bujeok-skip')).toBeNull()
})

test('stroke-dasharray가 이미 있는 draw 요소는 선 긋기 대신 페이드한다', () => {
  const spy = vi.fn()
  const orig = Element.prototype.animate
  Element.prototype.animate = function (this: Element, kf: unknown, opt: unknown) { spy(this, kf); return (orig as (...a: unknown[]) => Animation).call(this, kf, opt) } as typeof orig
  const { container } = render(<BujeokReveal spec={spec} name="민지" playKey={0} />)
  const dashed = container.querySelector('[data-a="draw"][stroke-dasharray]')
  if (dashed) {
    const call = spy.mock.calls.find((c) => c[0] === dashed)!
    expect(JSON.stringify(call[1])).not.toContain('strokeDashoffset')
  }
  expect(container.querySelectorAll('[data-a]').length).toBe(spy.mock.calls.length)
})

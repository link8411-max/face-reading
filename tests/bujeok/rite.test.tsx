// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BujeokRite from '@/components/bujeok/BujeokRite'
import { decodeStroke } from '@/lib/bujeok/stroke'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'pass', el: 'wood', variant: 0, finish: 'paper' }
const cute: BujeokSpec = { style: 'cute', wish: 'pass', el: 'wood', variant: 0, finish: 'paper' }

beforeEach(() => {
  vi.useFakeTimers()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** SVG CTM은 jsdom에 없어 크기 비율로 대신한다: 240×508 종이를 1:1 크기로 놓은 것으로 목(mock)한다 */
function pad() {
  const el = screen.getByTestId('bujeok-rite-pad')
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 240, height: 508, right: 240, bottom: 508, x: 0, y: 0, toJSON() {} }) as DOMRect
  return el
}
// 종이 좌표 → 화면 좌표(전통: 오른쪽 30, 아래 6 만큼 SVG 좌표가 다르다. 위 목에서 viewBox 30 6 240 508 → 1:1이라 종이 좌표 = 화면 좌표)
const ev = (x: number, y: number) => ({ clientX: x, clientY: y, pointerId: 1, isPrimary: true })

function drag(el: Element, points: [number, number][]) {
  fireEvent.pointerDown(el, ev(...points[0]))
  for (const p of points.slice(1)) fireEvent.pointerMove(el, ev(...p))
  fireEvent.pointerUp(el, ev(...points[points.length - 1]))
}
const GOOD: [number, number][] = [[120, 254], [121, 290], [119, 330], [121, 370], [118, 410], [119, 440]]

test('그냥 완성하기 → onDone(null), 언제나 보인다', () => {
  const onDone = vi.fn()
  render(<BujeokRite spec={spec} name={null} steps="draw-seal" onDone={onDone} />)
  fireEvent.click(screen.getByRole('button', { name: '그냥 완성하기' }))
  expect(onDone).toHaveBeenCalledWith(null)
  expect(onDone).toHaveBeenCalledTimes(1)
})

test('짧게 그은 획은 안내 문구가 나오고 onDone이 불리지 않는다', () => {
  const onDone = vi.fn()
  render(<BujeokRite spec={spec} name={null} steps="draw-seal" onDone={onDone} />)
  drag(pad(), [[120, 254], [121, 270], [121, 290]])
  expect(screen.getByRole('status').textContent).toContain('점선을 따라 아래까지 쭉 그어 주세요')
  expect(onDone).not.toHaveBeenCalled()
  expect(screen.getByTestId('bujeok-rite').getAttribute('data-step')).toBe('draw')
})

test('위로 그은 획과 시작점 밖에서 시작한 획은 완성으로 치지 않는다', () => {
  const onDone = vi.fn()
  render(<BujeokRite spec={spec} name={null} steps="draw" onDone={onDone} />)
  drag(pad(), [...GOOD].reverse())
  drag(pad(), [[20, 100], [20, 200], [20, 300], [20, 400], [20, 450]])
  expect(onDone).not.toHaveBeenCalled()
})

test('draw만이면 긋기 성공 즉시 onDone(획 코드)', () => {
  const onDone = vi.fn()
  render(<BujeokRite spec={spec} name="민지" steps="draw" onDone={onDone} />)
  drag(pad(), GOOD)
  expect(onDone).toHaveBeenCalledTimes(1)
  const code = onDone.mock.calls[0][0] as string
  expect(code).toMatch(/^s[0-9a-z]{24}$/)
  expect(decodeStroke(code)).not.toBeNull()
})

test('draw-seal: 긋고 나면 도장 단계, 도장 버튼을 키보드로 누르면 700ms 뒤 onDone(획 코드)', () => {
  const onDone = vi.fn()
  render(<BujeokRite spec={spec} name={null} steps="draw-seal" onDone={onDone} />)
  drag(pad(), GOOD)
  expect(onDone).not.toHaveBeenCalled()
  expect(screen.getByRole('status').textContent).toContain('도장을 꾹 눌러 찍어요')
  fireEvent.keyDown(screen.getByRole('button', { name: '도장 찍기' }), { key: 'Enter' })
  act(() => void vi.advanceTimersByTime(800))
  expect(onDone).toHaveBeenCalledTimes(1)
  expect(onDone.mock.calls[0][0]).toMatch(/^s[0-9a-z]{24}$/)
})

test('도장을 짧게 누르면 "조금 더 길게" 안내, 350ms 이상 누르면 찍힌다', () => {
  const onDone = vi.fn()
  render(<BujeokRite spec={cute} name={null} steps="seal" onDone={onDone} />)
  const btn = screen.getByRole('button', { name: '도장 찍기' })
  fireEvent.pointerDown(btn, ev(0, 0))
  fireEvent.pointerUp(btn, ev(0, 0))
  expect(screen.getByRole('status').textContent).toContain('조금 더 길게 눌러 주세요')
  expect(onDone).not.toHaveBeenCalled()
  const now = vi.spyOn(performance, 'now')
  now.mockReturnValue(1000)
  fireEvent.pointerDown(btn, ev(0, 0))
  now.mockReturnValue(1500)
  fireEvent.pointerUp(btn, ev(0, 0))
  act(() => void vi.advanceTimersByTime(800))
  expect(onDone).toHaveBeenCalledWith(null)
  now.mockRestore()
})

test('받는 사람(획 있는 선물): 안내 문구와 도장만 있다', () => {
  const stroke = 's' + '5a'.repeat(12)
  const onDone = vi.fn()
  render(<BujeokRite spec={{ ...spec, stroke }} name="민지" steps="seal" onDone={onDone} />)
  expect(screen.getByRole('status').textContent).toContain('보낸 사람이 그은 부적이에요. 도장을 찍어 완성해 주세요')
  fireEvent.click(screen.getByRole('button', { name: '그냥 완성하기' }))
  expect(onDone).toHaveBeenCalledWith(stroke) // 받은 획을 지우지 않는다
})

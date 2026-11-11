// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BujeokCard from '@/components/bujeok/BujeokCard'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 0, finish: 'gold' }

function mockMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
}
beforeEach(() => mockMotion(false))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const card = () => screen.getByTestId('bujeok-card')
const stage = () => screen.getByTestId('bujeok-stage')

// jsdom에 PointerEvent가 없을 수 있어 직접 만든다
function pointer(type: string, id: number, x: number, y: number) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })
  Object.defineProperty(e, 'pointerId', { value: id })
  Object.defineProperty(e, 'pointerType', { value: 'touch' })
  act(() => {
    stage().dispatchEvent(e)
  })
}

test('앞면에 SVG, 뒷면에 글귀 뜻과 응원 한 줄이 있다', () => {
  const { container } = render(<BujeokCard spec={spec} name="민지" />)
  expect(container.querySelector('[data-bujeok-art] svg')).toBeTruthy()
  const back = screen.getByTestId('bujeok-back')
  expect(back.textContent).toContain(WISH_TEXT.money.hanjaMeaning)
  expect(back.textContent).toContain(WISH_TEXT.money.sub)
  expect(back.textContent).toContain('민지에게')
})

test('이름이 없으면 "에게" 줄이 없고, from이 있으면 "드림"', () => {
  const { rerender } = render(<BujeokCard spec={spec} name={null} />)
  expect(screen.getByTestId('bujeok-back').textContent).not.toContain('에게')
  expect(screen.getByTestId('bujeok-back').textContent).not.toContain('드림')
  rerender(<BujeokCard spec={spec} name={null} from="철수" />)
  expect(screen.getByTestId('bujeok-back').textContent).toContain('철수 드림')
})

test('뒤집기 버튼을 누르면 data-face가 바뀐다', () => {
  render(<BujeokCard spec={spec} name={null} />)
  expect(card().getAttribute('data-face')).toBe('front')
  fireEvent.click(screen.getByTestId('bujeok-flip'))
  expect(card().getAttribute('data-face')).toBe('back')
  fireEvent.click(screen.getByTestId('bujeok-flip'))
  expect(card().getAttribute('data-face')).toBe('front')
})

test('prefers-reduced-motion이면 등장 회전 없이 앞면', () => {
  mockMotion(true)
  render(<BujeokCard spec={spec} name={null} enter />)
  expect(card().getAttribute('data-face')).toBe('front')
  expect(card().getAttribute('data-entering')).toBe('false')
})

test('enter이면 등장 회전 중임을 알린다', () => {
  render(<BujeokCard spec={spec} name={null} enter />)
  expect(card().getAttribute('data-entering')).toBe('true')
})

test('확대·축소 버튼은 0.25씩 바꾸고 범위 끝에서 비활성, 두 번 두드리면 원래 크기', () => {
  render(<BujeokCard spec={spec} name={null} />)
  const inn = screen.getByTestId('bujeok-zoom-in') as HTMLButtonElement
  const out = screen.getByTestId('bujeok-zoom-out') as HTMLButtonElement
  expect(stage().getAttribute('data-zoom')).toBe('1')
  fireEvent.click(inn)
  expect(stage().getAttribute('data-zoom')).toBe('1.25')
  fireEvent.click(inn)
  fireEvent.click(inn)
  fireEvent.click(inn)
  expect(stage().getAttribute('data-zoom')).toBe('2')
  expect(inn.disabled).toBe(true)
  fireEvent.click(out)
  expect(stage().getAttribute('data-zoom')).toBe('1.75')
  for (let i = 0; i < 6; i++) fireEvent.click(out)
  expect(stage().getAttribute('data-zoom')).toBe('0.7')
  expect(out.disabled).toBe(true)
  // 두 번 두드리기
  pointer('pointerdown', 1, 50, 50)
  pointer('pointerup', 1, 50, 50)
  pointer('pointerdown', 1, 50, 50)
  pointer('pointerup', 1, 50, 50)
  expect(stage().getAttribute('data-zoom')).toBe('1')
})

test('두 손가락으로 벌리면 커지고, 그동안 돌아가지 않는다', () => {
  render(<BujeokCard spec={spec} name={null} />)
  pointer('pointerdown', 1, 100, 100)
  pointer('pointerdown', 2, 200, 100)
  const ry0 = card().style.getPropertyValue('--ry')
  pointer('pointermove', 2, 250, 100)
  pointer('pointermove', 1, 50, 100)
  expect(stage().getAttribute('data-zoom')).toBe('2')
  pointer('pointermove', 2, 160, 100)
  expect(card().style.getPropertyValue('--ry')).toBe(ry0)
  pointer('pointerup', 2, 160, 100)
  pointer('pointerup', 1, 50, 100)
})

test('휠로 확대·축소', () => {
  render(<BujeokCard spec={spec} name={null} />)
  fireEvent.wheel(stage(), { deltaY: -200 })
  expect(Number(stage().getAttribute('data-zoom'))).toBeGreaterThan(1)
  fireEvent.wheel(stage(), { deltaY: 5000 })
  expect(stage().getAttribute('data-zoom')).toBe('0.7')
})

test('무대는 touch-action none', () => {
  render(<BujeokCard spec={spec} name={null} />)
  expect(stage().style.touchAction).toBe('none')
})

test('언마운트하면 rAF를 멈춘다', () => {
  const cancel = vi.spyOn(window, 'cancelAnimationFrame')
  const { unmount } = render(<BujeokCard spec={spec} name={null} />)
  unmount()
  expect(cancel).toHaveBeenCalled()
})

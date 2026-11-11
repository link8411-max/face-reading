// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import BujeokCard, { resetHintForTests } from '@/components/bujeok/BujeokCard'
import type { BujeokSpec } from '@/lib/bujeok/keys'
import { WISH_TEXT } from '@/content/bujeok'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 0, finish: 'gold' }

function mockMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
}
beforeEach(() => {
  mockMotion(false)
  resetHintForTests()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const card = () => screen.getByTestId('bujeok-card')
const stage = () => screen.getByTestId('bujeok-stage')

// jsdom에 PointerEvent가 없을 수 있어 직접 만든다
function pointer(type: string, id: number, x: number, y: number, primary = id === 1) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })
  Object.defineProperty(e, 'pointerId', { value: id })
  Object.defineProperty(e, 'pointerType', { value: 'touch' })
  Object.defineProperty(e, 'isPrimary', { value: primary })
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

test('휠: 그냥 휠은 페이지 스크롤(확대 없음, preventDefault 없음), ctrl+휠(트랙패드 핀치)만 확대·축소', () => {
  render(<BujeokCard spec={spec} name={null} />)
  const plain = new WheelEvent('wheel', { deltaY: -200, bubbles: true, cancelable: true })
  act(() => { stage().dispatchEvent(plain) })
  expect(plain.defaultPrevented).toBe(false)
  expect(stage().getAttribute('data-zoom')).toBe('1')
  const pinch = new WheelEvent('wheel', { deltaY: -200, ctrlKey: true, bubbles: true, cancelable: true })
  act(() => { stage().dispatchEvent(pinch) })
  expect(pinch.defaultPrevented).toBe(true)
  expect(Number(stage().getAttribute('data-zoom'))).toBeGreaterThan(1)
  act(() => { stage().dispatchEvent(new WheelEvent('wheel', { deltaY: 5000, ctrlKey: true, bubbles: true, cancelable: true })) })
  expect(stage().getAttribute('data-zoom')).toBe('0.7')
})

test('무대는 touch-action pan-y (세로로 밀면 페이지 스크롤, 가로는 돌리기, 두 손가락은 확대)', () => {
  render(<BujeokCard spec={spec} name={null} />)
  expect(stage().style.touchAction).toBe('pan-y')
})

// requestAnimationFrame을 손으로 돌려 본다
function fakeRaf() {
  const q: FrameRequestCallback[] = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { q.push(cb); return q.length })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { q.length = 0 })
  let t = 0
  return {
    pending: () => q.length,
    tick: (n = 1) => { for (let i = 0; i < n; i++) { const cb = q.shift(); t += 16; if (cb) act(() => cb(t)) } },
  }
}

test('lostpointercapture는 pointerup처럼 끝낸다', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  pointer('pointerdown', 1, 100, 100)
  pointer('pointermove', 1, 140, 100)
  pointer('lostpointercapture', 1, 140, 100)
  pointer('pointermove', 1, 220, 100) // 끝난 뒤의 움직임은 무시(22도 + 관성 한 프레임 = 44도, 계속 끌었다면 66도)
  raf.tick()
  expect(Number(card().style.getPropertyValue('--ry').replace('deg', ''))).toBeLessThan(55)
})

test('primary 포인터가 새로 눌리면 남아 있던 포인터를 지운다(두 손가락 취급 안 함)', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  pointer('pointerdown', 1, 100, 100) // up이 안 온 채 남은 포인터
  pointer('pointerdown', 5, 100, 100, true) // 새 primary
  pointer('pointermove', 5, 180, 100)
  raf.tick()
  expect(stage().getAttribute('data-zoom')).toBe('1')
  expect(Number(card().style.getPropertyValue('--ry').replace('deg', ''))).toBeGreaterThan(20)
})

test('움직임 줄이기: 먼지를 한 번 그리고 루프를 멈추고, 입력이 오면 다시 돌다가 쉬면 멈춘다', () => {
  mockMotion(true)
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  expect(raf.pending()).toBe(1)
  raf.tick()
  expect(raf.pending()).toBe(0) // 가만히 있는 카드는 다음 프레임을 요청하지 않는다
  fireEvent.click(screen.getByTestId('bujeok-flip')) // 관성으로 한 면 돈다
  expect(raf.pending()).toBe(1)
  for (let i = 0; i < 2000 && raf.pending(); i++) raf.tick()
  expect(raf.pending()).toBe(0)
  expect(card().getAttribute('data-face')).toBe('back')
})

test('움직임 줄이기를 안 켰으면 루프는 계속 돈다(먼지가 떠다님)', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  raf.tick(5)
  expect(raf.pending()).toBe(1)
})

test('언마운트하면 rAF를 멈춘다', () => {
  const cancel = vi.spyOn(window, 'cancelAnimationFrame')
  const { unmount } = render(<BujeokCard spec={spec} name={null} />)
  unmount()
  expect(cancel).toHaveBeenCalled()
})

// --- 처음 한 번 알려 주기: 좌우 흔들기 + "좌우로 밀어 돌려 보세요" ---
const HINT_TEXT = '좌우로 밀어 돌려 보세요'
const ryNow = () => Number(card().style.getPropertyValue('--ry').replace('deg', ''))

test('힌트: 등장 회전이 끝난 뒤에야 안내가 뜨고, 그 뒤 카드가 ±36도 안에서 좌우로 흔들린다', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} enter />)
  expect(screen.queryByText(HINT_TEXT)).toBeNull() // 등장 중
  raf.tick(100) // 1.6초 > 1.5초 등장
  expect(screen.getByText(HINT_TEXT)).toBeTruthy()
  let max = 0
  let min = 0
  for (let i = 0; i < 140; i++) {
    raf.tick()
    max = Math.max(max, ryNow())
    min = Math.min(min, ryNow())
  }
  expect(max).toBeGreaterThan(25)
  expect(min).toBeLessThan(-25)
  expect(max).toBeLessThanOrEqual(36)
  expect(min).toBeGreaterThanOrEqual(-36)
})

test('힌트: 흔드는 동안은 한가한 흔들림 대신 힌트 각도만 쓴다(22도를 넘는 값이 나오고 끝나면 0으로 돌아옴)', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  raf.tick(160) // 2.56초: 첫 흔들기 끝
  expect(Math.abs(ryNow())).toBeLessThan(0.5)
  raf.tick(60) // 가만히 있는 구간
  expect(ryNow()).toBe(0)
})

test('힌트: 6초쯤 뒤 한 번 더 흔들고, 그 뒤로 안내 글은 처음 건드릴 때까지 남는다', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  raf.tick(330) // 5.3초
  expect(ryNow()).toBe(0)
  let moved = false
  for (let i = 0; i < 60; i++) {
    raf.tick()
    if (Math.abs(ryNow()) > 20) moved = true
  }
  expect(moved).toBe(true)
  raf.tick(400)
  expect(screen.getByText(HINT_TEXT)).toBeTruthy()
})

test('힌트 취소: 포인터를 누르면 흔들기가 멈추고 안내가 사라진다', () => {
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} />)
  raf.tick(10)
  expect(screen.getByText(HINT_TEXT)).toBeTruthy()
  pointer('pointerdown', 1, 100, 100)
  expect(screen.queryByText(HINT_TEXT)).toBeNull()
  pointer('pointerup', 1, 100, 100)
  raf.tick(600) // 관성으로 가까운 면에 붙어 멈춘다. 힌트의 두 번째 흔들기(6초)가 와도 따르지 않는다
  expect(ryNow()).toBe(0)
  raf.tick(400)
  expect(ryNow()).toBe(0)
})

test('힌트 취소: 뒤집기 버튼·키보드 회전·휠 확대도 안내를 지운다', () => {
  for (const act1 of [
    () => fireEvent.click(screen.getByTestId('bujeok-flip')),
    () => fireEvent.keyDown(stage(), { key: 'ArrowRight' }),
    () => { act(() => { stage().dispatchEvent(new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true })) }) },
  ]) {
    resetHintForTests()
    const { unmount } = render(<BujeokCard spec={spec} name={null} />)
    expect(screen.getByText(HINT_TEXT)).toBeTruthy()
    act1()
    expect(screen.queryByText(HINT_TEXT)).toBeNull()
    unmount()
  }
})

test('힌트: 한 번 건드렸으면 같은 화면에서 카드를 다시 세워도 안내가 다시 뜨지 않는다', () => {
  const { unmount } = render(<BujeokCard spec={spec} name={null} />)
  pointer('pointerdown', 1, 100, 100)
  pointer('pointerup', 1, 100, 100)
  unmount()
  render(<BujeokCard spec={spec} name={null} />)
  expect(screen.queryByText(HINT_TEXT)).toBeNull()
})

test('움직임 줄이기: 흔들지 않고 안내만 보인다(루프도 멈춤)', () => {
  mockMotion(true)
  const raf = fakeRaf()
  render(<BujeokCard spec={spec} name={null} enter />)
  expect(screen.getByText(HINT_TEXT)).toBeTruthy()
  raf.tick(200)
  expect(ryNow()).toBe(0)
  expect(raf.pending()).toBe(0)
})

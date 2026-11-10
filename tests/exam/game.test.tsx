// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))
vi.mock('@/components/CoupangBanner', () => ({ default: () => null }))

import ExamGame from '@/components/exam/ExamGame'
import { track } from '@/lib/analytics'
import { loadReport, saveReport, streak } from '@/lib/exam/memory'
import { timeLimitMs } from '@/lib/exam/score'
import { enterMs } from '@/components/exam/motion'
import { rounds } from './fixture'
import { breakStorageAccess, installStorage, restoreStorage } from './storageStub'

const EMOJI = /[\u{1F300}-\u{1FAFF}☀-➿]/u

// 2026-11-11이 1회차이므로 11-13 낮 12시(KST)는 3회차
const NOON_R3 = new Date('2026-11-13T03:00:00Z')

const startBtn = () => screen.getByRole('button', { name: '시험 시작' })
const pickOption = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const next = () => fireEvent.click(screen.getByRole('button', { name: /^(다음 문제|성적표 보기)$/ }))
/** 한 문제를 정답으로 풀고 다음으로 */
const solveRight = (i: number) => {
  pickOption(i === 1 ? 'O' : '정답A')
  next()
}
function playAll(pick: (i: number) => void = solveRight) {
  for (let i = 0; i < 5; i++) pick(i)
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOON_R3)
  installStorage()
  vi.mocked(track).mockClear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  restoreStorage()
})

test('시작 화면: 오늘 회차와 안내, 시험 시작 버튼', () => {
  render(<ExamGame rounds={rounds} />)
  expect(screen.getByText(/3회차/)).toBeTruthy()
  expect(screen.getByText('5문제, 2분이면 끝나요')).toBeTruthy()
  expect(startBtn()).toBeTruthy()
})

test('보기를 누르면 해설이 나오고 다음 문제로 간다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  expect(screen.getByText('1 / 5')).toBeTruthy()
  expect(screen.getByText('질문 3-0')).toBeTruthy()
  pickOption('정답A')
  expect(screen.getByText('정답')).toBeTruthy()
  expect(screen.getByText('뜻 3-0')).toBeTruthy()
  expect(screen.getByText('쓰임 3-0')).toBeTruthy()
  expect(screen.getByText('유래 3-0')).toBeTruthy()
  next()
  expect(screen.getByText('2 / 5')).toBeTruthy()
  expect(track).toHaveBeenCalledWith('exam_start', { test_name: 'exam', result_id: 'meme' })
})

test('같은 문제에서 두 번 눌러도 답은 한 번', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  const btn = screen.getByRole('button', { name: '정답A' })
  fireEvent.click(btn)
  fireEvent.click(btn)
  next()
  expect(screen.getByText('2 / 5')).toBeTruthy()
  // 다 풀어도 성적표는 5칸
  pickOption('O'); next()
  solveRight(2); solveRight(3); solveRight(4)
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
  expect(loadReport(3)?.marks).toBe('OOOOO')
})

test('제한 시간이 지나면 오답 처리되고, 그 뒤에 누른 보기는 무시된다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  const stale = screen.getByRole('button', { name: '정답A' })
  // 시간은 등장 연출이 끝난 뒤부터 센다
  act(() => { vi.advanceTimersByTime(enterMs(rounds[2].questions[0]) + timeLimitMs(rounds[2].questions[0])) })
  expect(screen.getByText('아쉬워요')).toBeTruthy()
  fireEvent.click(stale)
  expect(screen.getByText('아쉬워요')).toBeTruthy()
  next()
  expect(screen.getByText('2 / 5')).toBeTruthy()
  // 나머지를 맞혀 보면 첫 문제는 X로 남아 있다
  solveRight(1); solveRight(2); solveRight(3); solveRight(4)
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
  expect(loadReport(3)?.marks).toBe('XOOOO')
})

test('9초에는 아직 문제 화면이다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  act(() => { vi.advanceTimersByTime(9_000) })
  expect(screen.getByRole('button', { name: '정답A' })).toBeTruthy()
  expect(screen.queryByText('아쉬워요')).toBeNull()
})

test('힌트는 한 판에 한 번, 오답 둘을 못 누르게 한다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  fireEvent.click(screen.getByRole('button', { name: '힌트 쓰기' }))
  const options = ['정답A', '오답B', '오답C', '오답D'].map((n) => screen.getByRole('button', { name: n }) as HTMLButtonElement)
  expect(options.filter((b) => b.disabled)).toHaveLength(2)
  expect(options[0].disabled).toBe(false)
  expect((screen.getByRole('button', { name: '힌트 쓰기' }) as HTMLButtonElement).disabled).toBe(true)
  pickOption('정답A')
  next()
  // O/X 문제에서는 쓸 수 없다
  expect((screen.getByRole('button', { name: '힌트 쓰기' }) as HTMLButtonElement).disabled).toBe(true)
  pickOption('O'); next()
  // 이미 썼으니 다음에도 못 쓴다
  expect((screen.getByRole('button', { name: '힌트 쓰기' }) as HTMLButtonElement).disabled).toBe(true)
})

test('O/X 문제에서는 힌트 버튼이 비활성이고 쓰지 않은 판은 이후 문제에서 쓸 수 있다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  pickOption('정답A'); next()
  expect((screen.getByRole('button', { name: '힌트 쓰기' }) as HTMLButtonElement).disabled).toBe(true)
  pickOption('O'); next()
  expect((screen.getByRole('button', { name: '힌트 쓰기' }) as HTMLButtonElement).disabled).toBe(false)
})

test('힌트를 쓴 판은 성적표에 힌트 1회가 나오고 가산점이 없다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  fireEvent.click(screen.getByRole('button', { name: '힌트 쓰기' }))
  playAll()
  expect(screen.getByText('힌트 1회')).toBeTruthy()
  expect(loadReport(3)?.hint).toBe(true)
})

test('대화 문제: 고른 말이 빈칸에 들어가고 상대 반응이 뜬다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  solveRight(0); solveRight(1); solveRight(2)
  expect(screen.getByText('뭐 해?')).toBeTruthy()
  pickOption('오답B')
  expect(screen.queryByText('틀린 반응')).toBeNull() // 점 세 개가 깜빡인 뒤에 뜬다
  expect(screen.getByLabelText('입력 중')).toBeTruthy()
  act(() => { vi.advanceTimersByTime(600) })
  expect(screen.getByText('틀린 반응')).toBeTruthy()
  expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '나 완전 오답B 됐어')).toBeTruthy()
})

test('도중에 날짜가 바뀌어도 시작한 회차의 성적표가 나온다', () => {
  vi.setSystemTime(new Date('2026-11-13T14:59:00Z')) // KST 23:59
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  vi.setSystemTime(new Date('2026-11-13T15:02:00Z')) // KST 자정 지남 -> 4회차 날
  playAll()
  expect(screen.getByText(/3회차/)).toBeTruthy()
  expect(loadReport(3)).not.toBeNull()
  expect(loadReport(4)).toBeNull()
})

test('오늘 회차를 이미 풀었으면 성적표부터 보인다', () => {
  saveReport({ round: 3, marks: 'OOXOO', score: 450, correct: 4, grade: 3, hint: false, ms: 30000 })
  render(<ExamGame rounds={rounds} />)
  expect(screen.getByText('밈 능력고사 성적통지표')).toBeTruthy()
  expect(screen.getByText('내일 문제는 자정에 열려요')).toBeTruthy()
  expect(screen.queryByRole('button', { name: '시험 시작' })).toBeNull()
})

test('오늘 회차 번호가 얼린 회차 수보다 크면 마지막 회차를 연다', () => {
  vi.setSystemTime(new Date('2027-03-01T03:00:00Z'))
  render(<ExamGame rounds={rounds} />)
  expect(screen.getByText(/5회차/)).toBeTruthy()
  fireEvent.click(startBtn())
  expect(screen.getByText('질문 5-0')).toBeTruthy()
})

test('challenge가 있으면 그 회차를 풀고, 오늘 성적표로 저장하지 않는다', () => {
  render(<ExamGame rounds={rounds} challenge={{ round: 2, marks: 'OXOOX', score: 345, grade: 5, hint: false }} />)
  expect(screen.getByText('친구는 5등급. 이길 수 있어요?')).toBeTruthy()
  expect(screen.getByText(/2회차/)).toBeTruthy()
  fireEvent.click(startBtn())
  expect(screen.getByText('질문 2-0')).toBeTruthy()
  playAll()
  expect(loadReport(2)).toBeNull()
  expect(loadReport(3)).toBeNull()
  expect(streak()).toBe(0)
})

test('challenge 회차가 오늘 회차와 같으면 저장한다', () => {
  render(<ExamGame rounds={rounds} challenge={{ round: 3, marks: 'OXOOX', score: 345, grade: 5, hint: false }} />)
  fireEvent.click(startBtn())
  playAll()
  expect(loadReport(3)).not.toBeNull()
})

test('저장소를 못 써도 놀이는 그대로 되고 연속 응시만 빠진다', () => {
  breakStorageAccess()
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  playAll()
  expect(screen.getByText('밈 능력고사 성적통지표')).toBeTruthy()
  expect(screen.queryByText(/일 연속/)).toBeNull()
})

test('성적표: 등급·별명·영역 칸·5문제 중 N개', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  playAll()
  // 120점씩(시간이 하나도 안 흘렀다) 5개 정답 -> 1등급
  expect(screen.getByText('1등급')).toBeTruthy()
  expect(screen.getByText('밈 고인물')).toBeTruthy()
  expect(screen.getByText('5문제 중 5개')).toBeTruthy()
  const table = screen.getByRole('table')
  expect(within(table).getByText('요즘 말')).toBeTruthy()
  expect(within(table).getByText('상황 밈')).toBeTruthy()
  expect(within(table).getByText('레트로')).toBeTruthy()
  expect(screen.getByText('운명을 읽다 · unse-ai.com')).toBeTruthy()
  expect(track).toHaveBeenCalledWith('exam_end', { test_name: 'exam', result_id: 'meme_g1' })
})

test('이틀 연속이면 연속 응시가 보인다', () => {
  saveReport({ round: 2, marks: 'OOOOO', score: 600, correct: 5, grade: 1, hint: false, ms: 1 })
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  playAll()
  expect(screen.getByText('2일 연속')).toBeTruthy()
})

test('화면에 이모지와 퍼센트 숫자가 없다', () => {
  const clean = (where: string) => {
    const t = document.body.textContent ?? ''
    expect(EMOJI.test(t), where).toBe(false)
    expect(/%|퍼센트|상위/.test(t), where).toBe(false)
  }
  render(<ExamGame rounds={rounds} challenge={{ round: 3, marks: 'OXOOX', score: 345, grade: 5, hint: false }} />)
  clean('시작')
  fireEvent.click(startBtn())
  clean('문제')
  pickOption('정답A')
  clean('해설')
  next()
  for (let i = 1; i < 5; i++) { solveRight(i) }
  clean('채점')
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
  clean('성적표')
})

test('움직임 줄이기: 막대는 줄지 않고 남은 초만 보이며, 채점 연출 없이 바로 성적표', () => {
  const mm = (q: string) => ({ matches: true, media: q, addEventListener: () => {}, removeEventListener: () => {} })
  vi.stubGlobal('matchMedia', mm)
  window.matchMedia = mm as unknown as typeof window.matchMedia
  try {
    render(<ExamGame rounds={rounds} />)
    fireEvent.click(startBtn())
    const timer = screen.getByTestId('timer')
    expect(timer.querySelector('[style*="transition"]')).toBeNull()
    expect(within(timer).getByText('12초')).toBeTruthy()
    for (let i = 0; i < 5; i++) solveRight(i)
    expect(screen.queryByText('채점 중이에요')).toBeNull()
    expect(screen.getByText('밈 능력고사 성적통지표')).toBeTruthy()
  } finally {
    vi.unstubAllGlobals()
    delete (window as { matchMedia?: unknown }).matchMedia
  }
})

test('등장 연출 중에 누른 보기도 정상 기록되고, 시간 초과 타이머는 여전히 작동한다', () => {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(startBtn())
  // 연출이 시작되자마자(0ms) 누른다
  pickOption('정답A')
  next()
  act(() => { vi.advanceTimersByTime(100) }) // 아직 등장 중
  pickOption('X') // O/X 문제의 오답
  next()
  solveRight(2); solveRight(3); solveRight(4)
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
  expect(loadReport(3)?.marks).toBe('OXOOO')
  // 등장 직후 눌렀으니 시간이 흐르지 않은 것으로 쳐서 가산점이 만점이다(120점)
  expect(loadReport(3)?.score).toBe(120 * 4)
})

test('움직임 줄이기: 성적표가 곧바로 최종 상태(등급·도장·O/X)', () => {
  const mm = (q: string) => ({ matches: true, media: q, addEventListener: () => {}, removeEventListener: () => {} })
  window.matchMedia = mm as unknown as typeof window.matchMedia
  try {
    saveReport({ round: 3, marks: 'OOXOO', score: 450, correct: 4, grade: 3, hint: false, ms: 1 })
    render(<ExamGame rounds={rounds} />)
    expect(screen.getByText('3등급')).toBeTruthy()
    expect(screen.getByText('눈팅은 하는 사람')).toBeTruthy()
    expect(screen.getByLabelText('문제별 결과').textContent).toBe('OOXOO')
    // 연출 시간을 하나도 기다리지 않았다
    expect(document.querySelector('.ex-settled')).toBeNull() // 연출 클래스는 CSS(@media)가 끄므로 DOM은 같다
  } finally {
    delete (window as { matchMedia?: unknown }).matchMedia
  }
})

test('성적표는 2초 뒤 또는 저장을 누르면 연출이 끝난 상태(ex-settled)로 고정된다', () => {
  saveReport({ round: 3, marks: 'OOXOO', score: 450, correct: 4, grade: 3, hint: false, ms: 1 })
  render(<ExamGame rounds={rounds} />)
  expect(document.querySelector('.ex-settled')).toBeNull()
  act(() => { vi.advanceTimersByTime(2100) })
  expect(document.querySelector('article.ex-settled')).not.toBeNull()
})

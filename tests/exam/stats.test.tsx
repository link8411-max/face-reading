// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))
vi.mock('@/components/CoupangBanner', () => ({ default: () => null }))

import ExamGame from '@/components/exam/ExamGame'
import { MIN_SOLVERS, parseRound, rateText, validatePlay } from '@/lib/exam/stats'
import { rounds } from './fixture'
import { installStorage, restoreStorage } from './storageStub'

test('rateText: 표본 기준 미만·이상한 값은 숨기고, 넘으면 반올림한 %', () => {
  expect(rateText(null)).toBeNull()
  expect(rateText({ n: MIN_SOLVERS - 1, correct: 10 })).toBeNull()
  expect(rateText({ n: 30, correct: 31 })).toBeNull()
  expect(rateText({ n: 30, correct: -1 })).toBeNull()
  expect(rateText({ n: NaN, correct: 1 })).toBeNull()
  expect(rateText({ n: 30, correct: 7 })).toBe('푼 사람의 23%가 맞혔어요')
  expect(rateText({ n: 40, correct: 40 })).toBe('푼 사람의 100%가 맞혔어요')
  expect(rateText({ n: 40, correct: 0 })).toBe('푼 사람의 0%가 맞혔어요')
})

test('validatePlay: 형식이 맞고 오늘 회차 이하인 것만', () => {
  const ok = { round: 3, marks: 'OXOOX', score: 345, grade: 5 }
  expect(validatePlay(ok, 3)).toEqual(ok)
  expect(validatePlay({ ...ok, round: 4 }, 3)).toBeNull() // 앞으로 나올 회차
  expect(validatePlay({ ...ok, round: 0 }, 3)).toBeNull()
  expect(validatePlay({ ...ok, round: 1.5 }, 3)).toBeNull()
  expect(validatePlay({ ...ok, marks: 'OXOO' }, 3)).toBeNull()
  expect(validatePlay({ ...ok, marks: 'OXOOA' }, 3)).toBeNull()
  expect(validatePlay({ ...ok, score: 601 }, 3)).toBeNull()
  expect(validatePlay({ ...ok, grade: 10 }, 3)).toBeNull()
  expect(validatePlay({ ...ok, birth: 1990 }, 3)).toBeNull() // 모르는 키는 거절
  expect(validatePlay([ok], 3)).toBeNull()
  expect(validatePlay(null, 3)).toBeNull()
})

test('parseRound: 1~오늘 회차 정수 문자열만', () => {
  expect(parseRound('3', 3)).toBe(3)
  expect(parseRound('1', 3)).toBe(1)
  expect(parseRound('4', 3)).toBeNull()
  expect(parseRound('0', 3)).toBeNull()
  expect(parseRound('03', 3)).toBeNull()
  expect(parseRound('2a', 3)).toBeNull()
  expect(parseRound(null, 3)).toBeNull()
})

// ---- 화면 ----
const NOON_R3 = new Date('2026-11-13T03:00:00Z')
let fetchMock: ReturnType<typeof vi.fn>
const ratesBody = (n: number, correct: number) => ({ ok: true, round: 3, rates: Array.from({ length: 5 }, () => ({ n, correct })) })

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOON_R3)
  installStorage()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  restoreStorage()
})

const respond = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) })
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })

async function startAndAnswerFirst() {
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(screen.getByRole('button', { name: '시험 시작' }))
  await flush()
  fireEvent.click(screen.getByRole('button', { name: '정답A' }))
}

test('표본 기준을 넘은 회차: 답을 고른 뒤 해설에 정답률이 보이고, 고르기 전에는 안 보인다', async () => {
  fetchMock.mockImplementation((url: string) => (url.startsWith('/api/exam/rates') ? respond(ratesBody(40, 10)) : respond({ ok: true })))
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(screen.getByRole('button', { name: '시험 시작' }))
  await flush()
  expect(fetchMock).toHaveBeenCalledWith('/api/exam/rates?round=3')
  expect(screen.queryByText(/푼 사람의/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '정답A' }))
  expect(screen.getByText('푼 사람의 25%가 맞혔어요')).toBeTruthy()
})

test('표본이 모자라면 정답률 칸이 없다', async () => {
  fetchMock.mockImplementation(() => respond(ratesBody(MIN_SOLVERS - 1, 10)))
  await startAndAnswerFirst()
  expect(screen.getByText('정답')).toBeTruthy()
  expect(screen.queryByText(/푼 사람의/)).toBeNull()
})

test('집계를 못 읽어도(503·네트워크 오류) 놀이는 그대로', async () => {
  fetchMock.mockImplementation(() => Promise.reject(new Error('offline')))
  await startAndAnswerFirst()
  expect(screen.getByText('정답')).toBeTruthy()
  expect(screen.queryByText(/푼 사람의/)).toBeNull()
})

test('판이 끝나면 회차·정오·점수·등급만 한 번 저장 요청', async () => {
  fetchMock.mockImplementation(() => respond({ ok: false }, false))
  render(<ExamGame rounds={rounds} />)
  fireEvent.click(screen.getByRole('button', { name: '시험 시작' }))
  for (let i = 0; i < 5; i++) {
    fireEvent.click(screen.getByRole('button', { name: i === 1 ? 'O' : '정답A' }))
    fireEvent.click(screen.getByRole('button', { name: /^(다음 문제|성적표 보기)$/ }))
  }
  const posts = fetchMock.mock.calls.filter(([u]) => u === '/api/exam/play')
  expect(posts).toHaveLength(1)
  const body = JSON.parse(posts[0][1].body)
  expect(Object.keys(body).sort()).toEqual(['grade', 'marks', 'round', 'score'])
  expect(body.round).toBe(3)
  expect(body.marks).toBe('OOOOO')
  expect(posts[0][1].method).toBe('POST')
  await flush()
  // 저장된 성적표를 다시 열어도 또 보내지 않는다
  cleanup()
  render(<ExamGame rounds={rounds} />)
  expect(fetchMock.mock.calls.filter(([u]) => u === '/api/exam/play')).toHaveLength(1)
})

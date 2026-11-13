// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))
vi.mock('@/components/CoupangBanner', () => ({ default: ({ subId }: { subId: string }) => <div data-testid="coupang" data-sub={subId} /> }))

import ExamSharePage, { generateMetadata } from '@/app/(ko)/exam/meme/r/[code]/page'
import ExamGame from '@/components/exam/ExamGame'
import { ogQueryOk } from '@/lib/ogQuery'
import frozen from '@/content/exam/meme-rounds.json'
import { rounds } from './fixture'
import { installStorage, restoreStorage } from './storageStub'

const params = (code: string) => ({ params: Promise.resolve({ code }) })
const start = () => fireEvent.click(screen.getByRole('button', { name: '시험 시작' }))
const pick = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const next = () => fireEvent.click(screen.getByRole('button', { name: /^(다음 문제|성적표 보기)$/ }))
// 정답(first) 또는 오답으로 다섯 문제를 푼다. wrongAt에 든 번호는 일부러 틀린다
function play(wrongAt: number[] = []) {
  for (let i = 0; i < 5; i++) {
    if (i === 1) pick(wrongAt.includes(i) ? 'X' : 'O')
    else pick(wrongAt.includes(i) ? '오답B' : '정답A')
    next()
  }
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-13T03:00:00Z'))
  installStorage()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  restoreStorage()
})

test('잘못된 코드로 들어와도 시작 화면이 보인다', async () => {
  for (const code of ['zzz', '999-OOOOO-9999-0', '3-OXOO-300-5', '99-OOOOO-600-1', '3-OXOOX-345-5x']) {
    cleanup()
    render(await ExamSharePage(params(code)))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('밈 능력고사')
    expect(screen.getByRole('button', { name: '시험 시작' })).toBeTruthy()
    expect(screen.queryByText(/친구는/)).toBeNull()
  }
})

test('유효한 도전장이면 친구 등급이 처음부터(정적 HTML에도) 보인다', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const html = renderToStaticMarkup(await ExamSharePage(params('3-OXOOX-345-5')))
  expect(html).toContain('친구는 5등급. 이길 수 있어요?')
  expect(html).toContain('3회차')
})

test('도전장으로 들어오면 친구 등급이 보이고, 다 풀면 O·X 두 줄과 승패가 보인다', () => {
  render(<ExamGame rounds={rounds} challenge={{ round: 2, marks: 'OXOOX', score: 345, grade: 5, hint: true }} />)
  expect(screen.getByText('친구는 5등급. 이길 수 있어요?')).toBeTruthy()
  start()
  play()
  const duel = screen.getByRole('region', { name: '친구와 대결' })
  expect(within(duel).getByText('친구')).toBeTruthy()
  expect(within(duel).getByText('나')).toBeTruthy()
  const rows = within(duel).getAllByRole('list')
  expect(rows).toHaveLength(2)
  expect(rows[0].textContent).toBe('OXOOX')
  expect(rows[1].textContent).toBe('OOOOO')
  expect(within(duel).getByText('이겼어요')).toBeTruthy()
  expect(within(duel).getByText('친구는 힌트를 썼어요')).toBeTruthy()
  expect(screen.getByRole('button', { name: '나도 도전장 보내기' })).toBeTruthy()
  // 점수 차는 쓰지 않는다
  expect(duel.textContent).not.toMatch(/\d{3}|점/)
})

test('상대가 더 높으면 졌어요', () => {
  render(<ExamGame rounds={rounds} challenge={{ round: 2, marks: 'OOOOO', score: 600, grade: 1, hint: false }} />)
  start()
  play([0])
  expect(screen.getByText('졌어요')).toBeTruthy()
  expect(screen.queryByText('친구는 힌트를 썼어요')).toBeNull()
})

test('성적표 아래에 공유·이미지 저장 버튼과 쿠팡 배너, 내일 안내', () => {
  render(<ExamGame rounds={rounds} />)
  start()
  play()
  expect(screen.getByRole('button', { name: '친구에게 도전장 보내기' })).toBeTruthy()
  expect(screen.getByRole('button', { name: '이미지 저장' })).toBeTruthy()
  const banner = screen.getByTestId('coupang')
  expect(banner.getAttribute('data-sub')).toBe('exam-meme')
  const tomorrow = screen.getByText('내일 문제는 자정에 열려요')
  expect(banner.compareDocumentPosition(tomorrow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.queryByRole('region', { name: '친구와 대결' })).toBeNull()
})

test('오늘 성적표 다시 보기에도 공유 버튼이 있다', () => {
  render(<ExamGame rounds={rounds} />)
  start()
  play()
  cleanup()
  render(<ExamGame rounds={rounds} />)
  expect(screen.getByText('밈 능력고사 성적통지표')).toBeTruthy()
  expect(screen.getByRole('button', { name: '친구에게 도전장 보내기' })).toBeTruthy()
})

test('착지 페이지 metadata는 noindex이고 canonical이 /exam/meme', async () => {
  const m = await generateMetadata(params('3-OXOOX-345-5'))
  expect(m.robots).toEqual({ index: false, follow: true })
  expect(m.alternates?.canonical).toBe('https://unse-ai.com/exam/meme')
  expect(String(m.title)).toBe('나 밈 능력고사 5등급 나왔어. 너는? | 운명을 읽다')
  expect((m.openGraph as { images: { url: string }[] }).images[0].url).toBe('https://unse-ai.com/api/og/result?kind=exam&grade=5&correct=3')
  expect((m.openGraph as { url: string }).url).toBe('https://unse-ai.com/exam/meme/r/3-OXOOX-345-5')
  // 잘못된 코드도 검색에는 안 나간다
  const bad = await generateMetadata(params('zzz'))
  expect(bad.robots).toEqual({ index: false, follow: true })
  expect(bad.alternates?.canonical).toBe('https://unse-ai.com/exam/meme')
  expect(frozen.rounds.length).toBeGreaterThanOrEqual(3)
})

test('ogQueryOk: kind=exam은 grade 1~9·correct 0~5만 받는다', () => {
  const ok = (q: string) => ogQueryOk(new URLSearchParams(q))
  expect(ok('kind=exam&grade=3&correct=4')).toBe(true)
  expect(ok('kind=exam&grade=9&correct=0')).toBe(true)
  expect(ok('kind=exam&grade=10&correct=4')).toBe(false)
  expect(ok('kind=exam&grade=0&correct=4')).toBe(false)
  expect(ok('kind=exam&grade=3&correct=6')).toBe(false)
  expect(ok('kind=exam&grade=03&correct=4')).toBe(false)
  expect(ok('kind=exam&grade=3&correct=4&x=1')).toBe(false)
  expect(ok('kind=exam&grade=3')).toBe(false)
  expect(ok('kind=exam&grade=3&correct=4&s=55')).toBe(false)
})

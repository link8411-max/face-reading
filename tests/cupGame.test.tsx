// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const nav = vi.hoisted(() => ({ search: '' }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(nav.search) }))
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))

import CupGame from '@/components/cup/CupGame'
import type { CupCard } from '@/lib/cup/cards'
import { track } from '@/lib/analytics'
import { pairKey } from '@/lib/people/keys'

const IDS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']
const cards: CupCard[] = IDS.map((id) => ({
  id,
  name: `장수${id}`,
  faction: '촉',
  portrait: `/images/${id}.jpg`,
  line: `${id}의 한 줄`,
  facts: [`${id}의 이야기`],
}))
const notes = {}

function setup(top5: { id: string; name: string; n: number }[] = [], n: Record<string, { note: string; source: '연의' | '정사' | '배송지 주' }> = notes) {
  return render(<CupGame board="warrior" title="테스트 판" cards={cards} notes={n} top5={top5} />)
}

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, counted: true, others: { a1: 0, a2: 0 } }) })
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(track).mockClear()
  nav.search = ''
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// 지금 화면의 두 카드 버튼(대결 카드만)
const matchCards = () => screen.getAllByTestId('cup-card') as HTMLButtonElement[]
const calls = () => fetchMock.mock.calls.filter((c) => (c[1]?.body as string)?.includes('"type":"match"'))
const bodyOf = (i: number) => JSON.parse(calls()[i][1].body as string)

async function playMatch(side = 0) {
  fireEvent.click(matchCards()[side])
  fireEvent.click(await screen.findByRole('button', { name: /다음 대결|결과 보기/ }))
}

test('첫 화면: 질문과 진행 표시', async () => {
  setup()
  expect(await screen.findByText('둘 중 누가 더 끌리나요?')).toBeTruthy()
  expect(screen.getByText('테스트 판 8강 · 1/4')).toBeTruthy()
  expect(matchCards()).toHaveLength(2)
  expect(track).toHaveBeenCalledWith('cup_start', { result_id: 'warrior' })
})

test('카드에는 이름, 한 줄, 알고 보면 + 사실이 있다', async () => {
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  expect(screen.getAllByText('알고 보면:')).toHaveLength(2)
  for (const b of matchCards()) {
    expect(b.textContent).toMatch(/장수a\d/)
    expect(b.textContent).toMatch(/a\d의 한 줄/)
    expect(b.textContent).toMatch(/a\d의 이야기/)
  }
})

test('왼쪽 카드를 두 번 빠르게 누르면 fetch는 한 번', async () => {
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  const [left] = matchCards()
  fireEvent.click(left)
  fireEvent.click(left)
  fireEvent.click(matchCards()[1])
  expect(calls()).toHaveLength(1)
  const body = bodyOf(0)
  expect(body).toMatchObject({ type: 'match', board: 'warrior' })
  expect([body.a, body.b]).toContain(body.pick)
})

test('만난 장면은 그 쌍에서만 보인다', async () => {
  const view = setup([], {})
  await screen.findByText('둘 중 누가 더 끌리나요?')
  expect(screen.queryByText('이 둘이 만난 장면:')).toBeNull()
  // 지금 화면의 쌍에만 장면을 준다(대진은 이미 뽑혀 바뀌지 않는다)
  const [x, y] = matchCards().map((b) => b.dataset.cardId as string)
  view.rerender(<CupGame board="warrior" title="테스트 판" cards={cards} notes={{ [pairKey(x, y)]: { note: '두 사람이 마주친 장면', source: '연의' } }} top5={[]} />)
  expect(screen.getByText('이 둘이 만난 장면:')).toBeTruthy()
  expect(screen.getByText('두 사람이 마주친 장면')).toBeTruthy()
  expect(screen.getByText('연의')).toBeTruthy()
  // 다른 쌍으로 넘어가면 사라진다
  await playMatch(0)
  expect(screen.getByText('테스트 판 8강 · 2/4')).toBeTruthy()
  expect(screen.queryByText('이 둘이 만난 장면:')).toBeNull()
})

test('장면이 전혀 없으면 그 줄이 없다', async () => {
  setup([], {})
  await screen.findByText('둘 중 누가 더 끌리나요?')
  expect(screen.queryByText('이 둘이 만난 장면:')).toBeNull()
})

test('고르면 고른 쪽이 표시되고 다음 대결 버튼이 바로 눌린다', async () => {
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  fireEvent.click(matchCards()[1])
  expect(matchCards()[1].getAttribute('aria-pressed')).toBe('true')
  expect(matchCards()[0].getAttribute('aria-pressed')).toBe('false')
  const next = screen.getByRole('button', { name: '다음 대결' })
  expect((next as HTMLButtonElement).disabled).toBe(false)
  await waitFor(() => expect(screen.getByTestId('ratio').textContent).toBe('이 대결을 처음 골랐어요'))
})

test('늦게 도착한 첫 응답은 두 번째 대결의 비율 칸에 들어가지 않는다', async () => {
  // 1번 대결의 응답은 지연, 2번 대결에서는 카드를 고르지만 그 응답은 끝내 오지 않는다.
  // 보호 장치가 없으면 1번 응답이 2번 대결의 비율 칸(고른 뒤라 표시됨)에 들어간다.
  let release!: (v: unknown) => void
  fetchMock.mockImplementationOnce(() => new Promise((r) => { release = r }))
  fetchMock.mockImplementationOnce(() => new Promise(() => {}))
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  fireEvent.click(matchCards()[0])
  fireEvent.click(screen.getByRole('button', { name: '다음 대결' }))
  expect(screen.getByText('테스트 판 8강 · 2/4')).toBeTruthy()
  fireEvent.click(matchCards()[0])
  expect(matchCards()[0].getAttribute('aria-pressed')).toBe('true')
  expect(calls()).toHaveLength(2)
  release({ ok: true, status: 200, json: async () => ({ ok: true, counted: true, others: {} }) })
  await new Promise((r) => setTimeout(r, 20))
  expect(screen.getByTestId('ratio').textContent).toBe('')
})

test('?with=<id>로 들어오면 그 장수가 대진에 들어간다', async () => {
  const pool: CupCard[] = Array.from({ length: 12 }, (_, i) => ({ ...cards[0], id: `p${i}`, name: `장수p${i}`, facts: ['x'] }))
  const round1 = async () => {
    const seen: string[] = []
    for (let i = 0; i < 4; i++) {
      await screen.findByText('둘 중 누가 더 끌리나요?')
      seen.push(...matchCards().map((b) => b.dataset.cardId as string))
      await playMatch(0)
    }
    return seen
  }
  // 12명 중 8명만 뽑히므로, 고정된 난수에서 빠지는 사람이 있다
  vi.spyOn(Math, 'random').mockReturnValue(0)
  const first = render(<CupGame board="warrior" title="테스트 판" cards={pool} notes={{}} top5={[]} />)
  const seen = await round1()
  first.unmount()
  const left = pool.map((c) => c.id).find((id) => !seen.includes(id))!
  expect(left).toBeTruthy()
  nav.search = `with=${left}`
  render(<CupGame board="warrior" title="테스트 판" cards={pool} notes={{}} top5={[]} />)
  expect(await round1()).toContain(left)
  vi.restoreAllMocks()
})

test('503이면 안내가 보이고 다음 대결로 계속 진행된다', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({ ok: false }) })
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  fireEvent.click(matchCards()[0])
  await waitFor(() => expect(screen.getByTestId('ratio').textContent).toBe('지금은 다른 사람 선택을 불러오지 못했어요'))
  fireEvent.click(screen.getByRole('button', { name: '다음 대결' }))
  expect(screen.getByText('테스트 판 8강 · 2/4')).toBeTruthy()
})

test('네트워크 오류나 others가 null이어도 안내가 보인다', async () => {
  fetchMock.mockRejectedValueOnce(new Error('offline'))
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  fireEvent.click(matchCards()[0])
  await waitFor(() => expect(screen.getByTestId('ratio').textContent).toBe('지금은 다른 사람 선택을 불러오지 못했어요'))
  fireEvent.click(screen.getByRole('button', { name: '다음 대결' }))
  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true, counted: true, others: null }) })
  fireEvent.click(matchCards()[0])
  await waitFor(() => expect(screen.getByTestId('ratio').textContent).toBe('지금은 다른 사람 선택을 불러오지 못했어요'))
})

test('7번 고르면 끝 화면: 최애 장수, 열전 링크, 다른 판 하기, win 전송, cup_end', async () => {
  setup()
  await screen.findByText('둘 중 누가 더 끌리나요?')
  for (let i = 0; i < 7; i++) await playMatch(0)
  expect(await screen.findByText('나의 최애 장수')).toBeTruthy()
  expect(calls()).toHaveLength(7)
  const winCall = fetchMock.mock.calls.find((c) => (c[1]?.body as string)?.includes('"type":"win"'))
  expect(winCall).toBeTruthy()
  const win = JSON.parse(winCall![1].body as string)
  expect(win).toMatchObject({ type: 'win', board: 'warrior' })
  expect(IDS).toContain(win.id)
  expect(track).toHaveBeenCalledWith('cup_end', { result_id: `warrior_${win.id}` })
  const profile = screen.getByRole('link', { name: `장수${win.id} 열전 보기` })
  expect(profile.getAttribute('href')).toBe(`/samguk/people/${win.id}`)
  expect(screen.getByRole('link', { name: '다른 판 하기' }).getAttribute('href')).toBe('/samguk/cup')
  expect(screen.getByRole('button', { name: /공유하기/ })).toBeTruthy()
  expect(screen.getByText(/결승까지/)).toBeTruthy()
})

test('top5가 빈 배열이면 순위 목록과 전체 순위 보기가 없다', async () => {
  setup([])
  await screen.findByText('둘 중 누가 더 끌리나요?')
  for (let i = 0; i < 7; i++) await playMatch(0)
  await screen.findByText('나의 최애 장수')
  expect(screen.queryByText('전체 순위 보기')).toBeNull()
  expect(screen.queryByTestId('cup-top5')).toBeNull()
})

test('top5가 있으면 순위와 전체 순위 보기가 있다', async () => {
  setup([{ id: 'a3', name: '장수a3', n: 5 }, { id: 'a1', name: '장수a1', n: 2 }])
  await screen.findByText('둘 중 누가 더 끌리나요?')
  for (let i = 0; i < 7; i++) await playMatch(0)
  await screen.findByText('나의 최애 장수')
  expect(screen.getByTestId('cup-top5').textContent).toContain('장수a3')
  expect(screen.getByRole('link', { name: '전체 순위 보기' }).getAttribute('href')).toBe('/samguk/cup/ranking')
})

test('클라이언트 월드컵 컴포넌트는 열전 본문·서버 카드 모듈을 번들에 넣지 않는다', () => {
  const dir = 'src/components/cup'
  const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
  expect(files.length).toBeGreaterThan(0)
  for (const f of [...files.map((x) => `${dir}/${x}`), 'src/lib/cup/share.ts']) {
    const src = readFileSync(f, 'utf8')
    expect(src, f).not.toMatch(/@\/content\/samgukPeople|@\/lib\/cup\/cards|samgukDB|lib\/people\/(hubCards|characters|relations|portrait)/)
  }
})

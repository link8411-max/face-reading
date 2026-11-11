// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))

import { installStorage, restoreStorage } from '../exam/storageStub'
import { addToBox, loadBox } from '@/lib/bujeok/box'
import { bujeokCode, parseBujeokCode } from '@/lib/bujeok/link'
import BujeokClient from '@/components/bujeok/BujeokClient'
import { handOffBirth } from '@/lib/bujeok/birthHandoff'
import { EL_TEXT } from '@/content/bujeok'

const shareResult = vi.fn<(...a: unknown[]) => Promise<string>>(async () => 'shared_link')
vi.mock('@/lib/share', () => ({ shareResult: (...a: unknown[]) => shareResult(...a), SHARE_NOTICE: { copied: '복사했어요', failed: '실패' } }))

beforeEach(() => {
  installStorage()
  shareResult.mockClear()
  window.history.replaceState(null, '', '/')
  track.mockClear()
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  restoreStorage()
})

const make = () => screen.getByRole('button', { name: '부적 만들기' })
const pick = (name: string) => fireEvent.click(screen.getByRole('radio', { name }))
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

test('소원·화풍을 고르기 전에는 만들기 버튼이 비활성', () => {
  render(<BujeokClient />)
  expect((make() as HTMLButtonElement).disabled).toBe(true)
  pick('재물')
  expect((make() as HTMLButtonElement).disabled).toBe(true)
  pick('전통')
  expect((make() as HTMLButtonElement).disabled).toBe(false)
})

test('생년월일 없이도 만들 수 있고 이때 기운은 WISH_DEFAULT_EL', async () => {
  render(<BujeokClient />)
  pick('재물')
  pick('전통')
  fireEvent.click(make())
  // 재물의 기본 기운은 metal
  expect(await screen.findByText(EL_TEXT.metal.line)).toBeTruthy()
})

test('2월 30일을 넣으면 안내 문구가 보이고 drawing으로 넘어가지 않는다', () => {
  render(<BujeokClient />)
  pick('재물')
  pick('전통')
  type('년도', '1990')
  type('월', '2')
  type('일', '30')
  expect(screen.getByRole('alert').textContent).toContain('2월은 28일까지 있어요')
  expect((make() as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(make())
  expect(screen.queryByTestId('bujeok-card')).toBeNull()
  expect(make()).toBeTruthy()
})

test('이름 칸은 선택이고, 넣은 이름이 cleanName을 통과하지 못하면 칸 아래 안내가 뜨고 만들기가 막힌다', () => {
  render(<BujeokClient />)
  pick('합격')
  pick('귀여운')
  expect((make() as HTMLButtonElement).disabled).toBe(false) // 이름 없이도 가능
  type('이름', '<script>')
  expect(screen.getByText(/이름은/)).toBeTruthy()
  expect((make() as HTMLButtonElement).disabled).toBe(true)
  type('이름', '민지')
  expect(screen.queryByText(/이름은/)).toBeNull()
  expect((make() as HTMLButtonElement).disabled).toBe(false)
})

test('마감은 필수 선택이고 기본은 금박이다', async () => {
  render(<BujeokClient />)
  expect(screen.getByRole('radio', { name: '금박' }).getAttribute('aria-checked')).toBe('true')
  expect(screen.getAllByRole('radio', { name: /종이|금박|홀로그램/ })).toHaveLength(3)
  pick('홀로그램')
  expect(screen.getByRole('radio', { name: '홀로그램' }).getAttribute('aria-checked')).toBe('true')
  pick('재물')
  pick('전통')
  fireEvent.click(make())
  await screen.findByTestId('bujeok-card')
  expect(document.querySelector('[data-bujeok-art] svg')!.innerHTML).toContain('bujeok-gold-holo')
})

test('만들면 바로 완성 화면(카드)이 뜬다. 중간 단계는 없다', async () => {
  render(<BujeokClient />)
  pick('합격')
  pick('귀여운')
  fireEvent.click(make())
  expect(await screen.findByTestId('bujeok-card')).toBeTruthy()
  expect(screen.getByRole('button', { name: '잠금화면용 저장' })).toBeTruthy()
})

test('다시 만들기는 form으로 돌아가지 않고 변형 번호만 새로 뽑아 다시 그린다', async () => {
  render(<BujeokClient />)
  pick('건강')
  pick('전통')
  fireEvent.click(make())
  await screen.findByRole('button', { name: '다시 만들기' })
  const before = document.querySelector('[data-bujeok-art] svg')!.innerHTML
  fireEvent.click(screen.getByRole('button', { name: '다시 만들기' }))
  expect(screen.queryByRole('button', { name: '부적 만들기' })).toBeNull()
  await screen.findByRole('button', { name: '다시 만들기' })
  expect(document.querySelector('[data-bujeok-art] svg')!.innerHTML).not.toBe(before)
})

test('완성 화면에 네 버튼이 있고 선물하기는 /bujeok?mode=gift&style=로 간다', async () => {
  render(<BujeokClient />)
  pick('연애')
  pick('귀여운')
  fireEvent.click(make())
  await screen.findByRole('button', { name: '다시 만들기' })
  expect(screen.getByRole('button', { name: '잠금화면용 저장' })).toBeTruthy()
  expect(screen.getByRole('button', { name: '공유하기' })).toBeTruthy()
  expect(screen.getByRole('link', { name: '선물하기' }).getAttribute('href')).toBe('/bujeok?mode=gift&style=cute')
})

test('넘겨받은 생년월일(takeHandedBirth)이 있으면 칸이 채워져 있다', () => {
  handOffBirth({ year: 1990, month: 5, day: 15, isLunar: false, isLeapMonth: false })
  render(<BujeokClient />)
  expect((screen.getByLabelText('년도') as HTMLInputElement).value).toBe('1990')
  expect((screen.getByLabelText('월') as HTMLInputElement).value).toBe('5')
  expect((screen.getByLabelText('일') as HTMLInputElement).value).toBe('15')
})

test('result_view는 result_id가 `<화풍>_<소원>`이고 이름·생년이 실리지 않는다', async () => {
  render(<BujeokClient />)
  pick('재물')
  pick('전통')
  type('이름', '민지')
  type('년도', '1990')
  type('월', '5')
  type('일', '15')
  fireEvent.click(make())
  await waitFor(() => expect(track).toHaveBeenCalledWith('result_view', { test_name: 'bujeok', result_id: 'trad_money' }))
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/민지|1990/)
  await act(async () => {})
})

test('initial의 소원·화풍이 미리 골라져 있다', () => {
  render(<BujeokClient initial={{ wish: 'love', style: 'cute' }} />)
  expect(screen.getByRole('radio', { name: '연애' }).getAttribute('aria-checked')).toBe('true')
  expect(screen.getByRole('radio', { name: '귀여운' }).getAttribute('aria-checked')).toBe('true')
})

// --- 내 부적 링크와 부적함 ---
const makeMine = async (name?: string) => {
  render(<BujeokClient />)
  pick('재물')
  pick('전통')
  if (name) type('이름', name)
  fireEvent.click(make())
  await screen.findByRole('button', { name: '다시 만들기' })
}

test('내 부적을 만들면 부적함(mine)에 저장하고 주소를 /bujeok/r/<코드>?me=1#to=…로 바꾼다', async () => {
  await makeMine('민지')
  const items = loadBox()!
  expect(items).toMatchObject([{ to: '민지', from: null, kind: 'mine' }])
  expect(window.location.pathname).toBe(`/bujeok/r/${items[0].code}`)
  expect(window.location.search).toBe('?me=1')
  expect(window.location.hash).toBe('#to=%EB%AF%BC%EC%A7%80')
  expect(parseBujeokCode(items[0].code)).toMatchObject({ style: 'trad', wish: 'money' })
  expect(JSON.stringify(items)).not.toMatch(/birth|year/)
})

test('이름이 없으면 해시도 없다. 생년월일은 주소·저장소 어디에도 없다', async () => {
  render(<BujeokClient />)
  pick('재물')
  pick('전통')
  type('년도', '1990')
  type('월', '5')
  type('일', '15')
  fireEvent.click(make())
  await screen.findByRole('button', { name: '다시 만들기' })
  expect(window.location.hash).toBe('')
  expect(window.location.href).not.toMatch(/1990/)
  expect(JSON.stringify(loadBox())).not.toMatch(/1990/)
})

test('다시 만들기는 바뀐 카드 주소로 갱신하고, 부적함의 이전 항목을 새 항목으로 바꾼다', async () => {
  await makeMine()
  const before = loadBox()![0].code
  fireEvent.click(screen.getByRole('button', { name: '다시 만들기' }))
  await screen.findByRole('button', { name: '다시 만들기' })
  const after = loadBox()!
  expect(after.length).toBe(1)
  expect(after[0].code).not.toBe(before)
  expect(window.location.pathname).toBe(`/bujeok/r/${after[0].code}`)
})

test('완성 화면에 "내 부적 링크 보내기"(내 부적 주소 공유)와 "내 부적함" 링크가 있다', async () => {
  await makeMine('민지')
  expect(screen.getByRole('link', { name: '내 부적함' }).getAttribute('href')).toBe('/bujeok/box')
  fireEvent.click(screen.getByRole('button', { name: '내 부적 링크 보내기' }))
  await waitFor(() => expect(shareResult).toHaveBeenCalledTimes(1))
  const arg = shareResult.mock.calls[0][0] as { url: string; text: string }
  const code = loadBox()![0].code
  expect(arg.url).toBe(`https://unse-ai.com/bujeok/r/${code}?me=1#to=%EB%AF%BC%EC%A7%80`)
  expect(arg.text).toBe('언제든 다시 열어 볼 수 있어요')
  expect(bujeokCode(parseBujeokCode(code)!)).toBe(code)
})

test('다시하기(돌아가기)로 폼에 돌아가면 주소를 시작 화면으로 되돌린다', async () => {
  await makeMine('민지')
  fireEvent.click(screen.getByRole('button', { name: '다시하기' }))
  expect(window.location.pathname).toBe('/')
  expect(window.location.search).toBe('')
  expect(window.location.hash).toBe('')
})

test('선물 모드 완성 화면은 주소를 바꾸지 않고 부적함(mine)에도 넣지 않는다', async () => {
  render(<BujeokClient initial={{ mode: 'gift' }} />)
  pick('연애')
  pick('귀여운')
  type('받는 사람 이름', '민지')
  fireEvent.click(make())
  await screen.findByTestId('bujeok-card')
  expect(window.location.pathname).toBe('/')
  expect(loadBox()).toEqual([])
  expect(screen.getByRole('link', { name: '내 부적함' }).getAttribute('href')).toBe('/bujeok/box')
})

test('시작 화면의 "내 부적함 (N)"은 부적함에 하나라도 있을 때만 보인다', async () => {
  const { unmount } = render(<BujeokClient />)
  expect(screen.queryByRole('link', { name: /내 부적함/ })).toBeNull()
  unmount()
  addToBox({ code: 'trad-money-metal-1-gold', to: null, from: null, kind: 'mine' })
  addToBox({ code: 'cute-love-fire-2-holo', to: '철수', from: null, kind: 'received' })
  render(<BujeokClient />)
  const link = await screen.findByRole('link', { name: '내 부적함 (2)' })
  expect(link.getAttribute('href')).toBe('/bujeok/box')
})

test('?mode=gift&wish=pass: 선물 모드와 합격 소원이 미리 골라져 있다', () => {
  render(<BujeokClient initial={{ mode: 'gift', wish: 'pass' }} />)
  expect(screen.getByRole('radio', { name: '선물 보내기' }).getAttribute('aria-checked')).toBe('true')
  expect(screen.getByRole('radio', { name: '내 부적' }).getAttribute('aria-checked')).toBe('false')
  expect(screen.getByRole('radio', { name: '합격' }).getAttribute('aria-checked')).toBe('true')
})

test('소원 고르기: 열한 개가 WISH_ORDER 순서로 3열 격자에 보이고, 새 소원으로도 부적이 만들어진다', async () => {
  const { WISH_ORDER } = await import('@/lib/bujeok/keys')
  const { WISH_TEXT } = await import('@/content/bujeok')
  render(<BujeokClient />)
  const group = screen.getByRole('radiogroup', { name: '어떤 소원을 담을까요?' })
  expect(group.className).toContain('grid-cols-3')
  const labels = [...group.querySelectorAll('[role=radio]')].map((e) => e.textContent)
  expect(labels).toEqual(WISH_ORDER.map((w) => WISH_TEXT[w].label))
  expect(labels).toHaveLength(11)
  pick('삼재 막이')
  pick('전통')
  fireEvent.click(make())
  // 삼재 막이의 기본 기운은 water
  expect(await screen.findByText(EL_TEXT.water.line)).toBeTruthy()
})

test('?wish=samjae로 열면 삼재 막이가 미리 골라져 있다', () => {
  render(<BujeokClient initial={{ wish: 'samjae' }} />)
  expect(screen.getByRole('radio', { name: '삼재 막이' }).getAttribute('aria-checked')).toBe('true')
})

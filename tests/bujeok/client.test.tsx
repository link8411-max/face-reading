// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))

import BujeokClient from '@/components/bujeok/BujeokClient'
import { handOffBirth } from '@/lib/bujeok/birthHandoff'
import { EL_TEXT } from '@/content/bujeok'

beforeEach(() => {
  track.mockClear()
  // jsdom에는 Web Animations가 없어 연출이 곧바로 끝난다
})
afterEach(cleanup)

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
  expect(screen.queryByTestId('bujeok-skip')).toBeNull()
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

test('다시 만들기는 form으로 돌아가지 않고 변형 번호만 새로 뽑아 다시 그린다', async () => {
  render(<BujeokClient />)
  pick('건강')
  pick('전통')
  fireEvent.click(make())
  await screen.findByRole('button', { name: '다시 만들기' })
  const before = document.querySelector('svg[role="img"]')!.innerHTML
  fireEvent.click(screen.getByRole('button', { name: '다시 만들기' }))
  expect(screen.queryByRole('button', { name: '부적 만들기' })).toBeNull()
  await screen.findByRole('button', { name: '다시 만들기' })
  expect(document.querySelector('svg[role="img"]')!.innerHTML).not.toBe(before)
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

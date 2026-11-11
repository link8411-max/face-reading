// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { breakStorageAccess, installStorage, restoreStorage } from '../exam/storageStub'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import BujeokBox from '@/components/bujeok/BujeokBox'
import BoxPage, { metadata } from '@/app/bujeok/box/page'
import { SITEMAP_ROUTES } from '@/app/sitemap'
import { addToBox, loadBox } from '@/lib/bujeok/box'

const A = 'trad-money-metal-1-gold'
const B = 'cute-love-fire-2-holo'
const C = 'cute-pass-wood-0-paper'

beforeEach(() => {
  installStorage()
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  restoreStorage()
})

test('비었으면 "아직 모은 부적이 없어요"와 만들기 버튼', () => {
  render(<BujeokBox />)
  expect(screen.getByText('아직 모은 부적이 없어요')).toBeTruthy()
  expect(screen.getByRole('link', { name: '부적 만들기' }).getAttribute('href')).toBe('/bujeok')
})

test('저장소를 못 쓰면 안내 문구만 보이고 깨지지 않는다', () => {
  breakStorageAccess()
  render(<BujeokBox />)
  expect(screen.getByText('이 브라우저에서는 부적함을 쓸 수 없어요')).toBeTruthy()
  expect(screen.queryByText('아직 모은 부적이 없어요')).toBeNull()
})

test('내 부적·받은 부적·보낸 부적으로 묶어 작은 카드 그림, 이름 줄, 날짜를 보인다', () => {
  addToBox({ code: A, to: '민지', from: null, kind: 'mine' })
  addToBox({ code: B, to: '철수', from: '영희', kind: 'received' })
  addToBox({ code: C, to: '하늘', from: null, kind: 'sent' })
  render(<BujeokBox />)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('내 부적함')
  const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(heads).toEqual(['내 부적', '받은 부적', '보낸 부적'])
  const mine = screen.getByRole('link', { name: /민지님의 부적/ })
  expect(mine.getAttribute('href')).toBe(`/bujeok/r/${A}?me=1#to=%EB%AF%BC%EC%A7%80`)
  expect(mine.querySelector('svg')).toBeTruthy()
  expect(within(mine).getByText(/^\d{4}\.\d{1,2}\.\d{1,2}$/)).toBeTruthy()
  const got = screen.getByRole('link', { name: /철수님께 부적이 도착했어요/ })
  expect(got.textContent).toContain('영희님이 보냈어요')
  expect(got.getAttribute('href')).toBe(`/bujeok/r/${B}#to=%EC%B2%A0%EC%88%98&from=%EC%98%81%ED%9D%AC`)
  expect(screen.getByRole('link', { name: /하늘님께 보낸 부적/ }).getAttribute('href')).toBe(`/bujeok/r/${C}#to=%ED%95%98%EB%8A%98`)
})

test('항목이 없는 묶음은 제목도 없다', () => {
  addToBox({ code: A, to: null, from: null, kind: 'mine' })
  render(<BujeokBox />)
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['내 부적'])
  expect(screen.getByRole('link', { name: /나의 부적/ })).toBeTruthy()
})

test('안내 문구: 이 폰에만 저장 · 링크를 따로 보내 두기 · 홈 화면에 추가', () => {
  addToBox({ code: A, to: null, from: null, kind: 'mine' })
  render(<BujeokBox />)
  expect(screen.getByText(/이 폰에만 저장돼요\. 폰을 바꾸거나 기록을 지우면 사라지니, 아끼는 부적은 링크를 따로 보내 두세요\./)).toBeTruthy()
  expect(screen.getByText(/홈 화면에 추가/)).toBeTruthy()
})

test('지우기: 앱 안 확인(confirm() 없이) → 네, 지울게요를 눌러야 지워진다. 취소하면 그대로', () => {
  const confirm = vi.spyOn(window, 'confirm')
  addToBox({ code: A, to: '민지', from: null, kind: 'mine' })
  addToBox({ code: B, to: '철수', from: null, kind: 'received' })
  render(<BujeokBox />)
  fireEvent.click(screen.getAllByRole('button', { name: '지우기' })[0])
  expect(screen.getByText('이 부적을 지울까요?')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '취소' }))
  expect(screen.queryByText('이 부적을 지울까요?')).toBeNull()
  expect(loadBox()!.length).toBe(2)
  fireEvent.click(screen.getAllByRole('button', { name: '지우기' })[0])
  fireEvent.click(screen.getByRole('button', { name: '네, 지울게요' }))
  expect(loadBox()!.length).toBe(1)
  expect(screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/bujeok/r/')).length).toBe(1)
  expect(confirm).not.toHaveBeenCalled()
  // 마지막 하나까지 지우면 빈 상태
  fireEvent.click(screen.getByRole('button', { name: '지우기' }))
  fireEvent.click(screen.getByRole('button', { name: '네, 지울게요' }))
  expect(screen.getByText('아직 모은 부적이 없어요')).toBeTruthy()
})

test('/bujeok/box 페이지: noindex, canonical /bujeok, 사이트맵에 없다', () => {
  expect(metadata.robots).toEqual({ index: false, follow: true })
  expect(metadata.alternates?.canonical).toBe('https://unse-ai.com/bujeok')
  expect(String(metadata.title)).toContain('내 부적함')
  expect((SITEMAP_ROUTES as readonly string[]).some((r) => r.startsWith('/bujeok/'))).toBe(false)
  expect(typeof BoxPage).toBe('function')
})

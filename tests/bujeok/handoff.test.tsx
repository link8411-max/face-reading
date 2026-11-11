// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))
vi.mock('next/link', () => ({
  default: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void } & Record<string, unknown>) => (
    <a href={href} onClick={(e) => { e.preventDefault(); onClick?.() }} {...rest}>{children}</a>
  ),
}))

import NextSteps from '@/components/result/NextSteps'
import { takeHandedBirth } from '@/lib/bujeok/birthHandoff'

afterEach(() => {
  cleanup()
  takeHandedBirth()
})

test('사주 결과의 부적 카드를 누르면 입력한 생년월일이 메모리로 넘어간다(한 번 꺼내면 사라진다)', () => {
  const birth = { year: 1990, month: 5, day: 15, isLunar: true, isLeapMonth: false }
  render(<NextSteps from="saju" birth={birth} />)
  const link = document.querySelector('[data-next-step="bujeok"]') as HTMLElement
  expect(link.getAttribute('href')).toBe('/bujeok')
  fireEvent.click(link)
  expect(track).toHaveBeenCalledWith('next_test_click', { test_name: 'bujeok' })
  expect(takeHandedBirth()).toEqual(birth)
  expect(takeHandedBirth()).toBeNull()
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/1990/)
})

test('생년월일이 없거나 다른 카드를 누르면 넘기지 않는다', () => {
  render(<NextSteps from="saju" />)
  fireEvent.click(document.querySelector('[data-next-step="bujeok"]') as HTMLElement)
  expect(takeHandedBirth()).toBeNull()
  cleanup()
  render(<NextSteps from="saju" birth={{ year: 1990, month: 5, day: 15, isLunar: false, isLeapMonth: false }} />)
  fireEvent.click(document.querySelector('[data-next-step="face"]') as HTMLElement)
  expect(takeHandedBirth()).toBeNull()
})

test('생년월일은 브라우저 저장소에 쓰지 않는다', () => {
  const set = vi.spyOn(Storage.prototype, 'setItem')
  render(<NextSteps from="fortune" birth={{ year: 1990, month: 5, day: 15, isLunar: false, isLeapMonth: false }} />)
  fireEvent.click(document.querySelector('[data-next-step="bujeok"]') as HTMLElement)
  expect(set).not.toHaveBeenCalled()
  void screen
})

// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SEASON, seasonFor } from '@/content/season'
import SeasonCard from '@/components/home/SeasonCard'

const kst = (s: string) => new Date(`${s}+09:00`)

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test.each([
  ['2026-11-11T10:00:00', '수능 D-8'],
  ['2026-11-18T23:59:00', '수능 D-1'],
  ['2026-11-19T00:00:00', '수능 D-DAY'],
  ['2026-11-19T23:59:00', '수능 D-DAY'],
  ['2026-11-20T00:00:00', '수능 수고했어요'],
  ['2026-11-20T23:59:00', '수능 수고했어요'],
])('seasonFor(%s) 칩 = %s', (t, chip) => {
  const s = seasonFor(kst(t))
  expect(s.chip).toBe(chip)
  expect(s.title).toBe('수험생에게\n합격 부적 보내기')
  expect(s.sub).toBe('이름 도장 찍힌 부적 카드, 카톡으로 선물')
  expect(s.cta).toEqual({ label: '합격 부적 보내기', href: '/bujeok?mode=gift&wish=pass' })
})

test('한국 시간 기준: UTC로는 아직 11/18인 11/19 00:30(KST)도 D-DAY', () => {
  expect(seasonFor(new Date('2026-11-18T15:30:00Z')).chip).toBe('수능 D-DAY')
})

test('11/21부터는 평소 사주 카드로 돌아간다', () => {
  expect(seasonFor(kst('2026-11-21T00:00:00'))).toBe(SEASON)
  expect(seasonFor(kst('2027-03-01T00:00:00'))).toBe(SEASON)
})

test('서버 렌더는 항상 기본(사주) 카드 — 정적 HTML에 어제 날짜가 박히지 않는다', () => {
  const html = renderToStaticMarkup(<SeasonCard />)
  expect(html).toContain('내 사주 보기')
  expect(html).not.toContain('수능')
})

test('마운트 뒤 수능 기간이면 수능 카드로 바뀌고 링크가 맞다', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(kst('2026-11-12T09:00:00'))
  render(<SeasonCard />)
  expect(screen.getByText('수능 D-7')).toBeTruthy()
  expect(screen.getByRole('link', { name: '합격 부적 보내기' }).getAttribute('href')).toBe('/bujeok?mode=gift&wish=pass')
})

test('수능 뒤에는 사주 카드, 탭이 다시 보일 때 날짜를 다시 맞춘다', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(kst('2026-11-19T23:00:00'))
  render(<SeasonCard />)
  expect(screen.getByText('수능 D-DAY')).toBeTruthy()
  vi.setSystemTime(kst('2026-11-20T00:10:00'))
  act(() => { window.dispatchEvent(new Event('focus')) })
  expect(screen.getByText('수능 수고했어요')).toBeTruthy()
  vi.setSystemTime(kst('2026-11-21T00:10:00'))
  act(() => { window.dispatchEvent(new Event('focus')) })
  expect(screen.getByRole('link', { name: '내 사주 보기' })).toBeTruthy()
})

test('season.ts: 12/1 신년운세 교체 안내 주석이 남아 있고 수능 뒤 복귀를 설명한다', async () => {
  const { readFileSync } = await import('node:fs')
  const src = readFileSync('src/content/season.ts', 'utf8')
  expect(src).toMatch(/\/\/\s+cta: \{ label: '지금 확인하기', href: '\/fortune' \}/)
  expect(src).toContain('12/1')
  expect(src).toContain('seasonFor')
})

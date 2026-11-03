import { renderToStaticMarkup } from 'react-dom/server'
import { ratioView, LOW_VOTE_TEXT } from '@/components/people/usePersonStats'
import CheerButton from '@/components/people/CheerButton'
import VotePoll from '@/components/people/VotePoll'
import TopVerdictChip from '@/components/people/TopVerdictChip'
import { pairKey, kstDay } from '@/lib/people/keys'
import { pairKey as pairKeyFromVotes, kstDay as kstDayFromVotes } from '@/lib/people/votes'
import { track } from '@/lib/analytics'
import { readFileSync } from 'node:fs'
import Page from '@/app/samguk/people/[id]/page'

describe('ratioView', () => {
  test('합이 10 미만이면 숨긴다', () => {
    expect(ratioView({ a: 3, b: 2 }).show).toBe(false)
    expect(ratioView({}).show).toBe(false)
  })
  test('6:4 는 60/40', () => {
    expect(ratioView({ a: 6, b: 4 })).toEqual({ show: true, pct: { a: 60, b: 40 } })
  })
  test('반올림해도 합이 100', () => {
    const { show, pct } = ratioView({ a: 1, b: 1, c: 1, d: 7 })
    expect(show).toBe(true)
    expect(Object.values(pct).reduce((s, n) => s + n, 0)).toBe(100)
    const t = ratioView({ a: 4, b: 4, c: 4 })
    expect(Object.values(t.pct).reduce((s, n) => s + n, 0)).toBe(100)
  })
  test('threshold 인자와 문구', () => {
    expect(ratioView({ a: 3, b: 2 }, 5).show).toBe(true)
    expect(LOW_VOTE_TEXT).toBe('아직 투표가 적어요')
  })
})

test('keys: votes.ts 와 같은 함수', () => {
  expect(pairKey).toBe(pairKeyFromVotes)
  expect(kstDay).toBe(kstDayFromVotes)
  expect(pairKey('guanyu', 'caocao')).toBe('caocao__guanyu')
})

test('CheerButton 서버 렌더: 문구만 있고 숫자 영역은 없다', () => {
  const html = renderToStaticMarkup(<CheerButton id="guanyu" name="관우" />)
  expect(html).toContain('응원하기')
  expect(html).not.toContain('data-cheer-count')
})

test('VotePoll 서버 렌더: 투표 전에는 % 가 없다', () => {
  const html = renderToStaticMarkup(
    <VotePoll
      kind="duel"
      id="guanyu"
      target="caocao__guanyu"
      title="관우 vs 조조, 일기토하면 누가 이길까?"
      options={[{ key: 'guanyu', label: '관우' }, { key: 'caocao', label: '조조' }]}
    />,
  )
  expect(html).toContain('관우 vs 조조, 일기토하면 누가 이길까?')
  expect(html).toContain('조조')
  expect(html).not.toContain('%')
})

test('TopVerdictChip 서버 렌더: 집계 전에는 아무것도 그리지 않는다', () => {
  expect(renderToStaticMarkup(<TopVerdictChip id="guanyu" options={[{ key: 'loyal', label: '충신' }]} />)).toBe('')
})

test('analytics: people 이벤트와 test_name', () => {
  const calls: unknown[][] = []
  ;(globalThis as unknown as { window: unknown }).window = { gtag: (...a: unknown[]) => calls.push(a) }
  track('people_cheer', { result_id: 'guanyu' })
  track('people_vote', { result_id: 'duel_guanyu' })
  track('share_click', { test_name: 'people', method: 'link' })
  delete (globalThis as unknown as { window?: unknown }).window
  expect(calls).toEqual([
    ['event', 'people_cheer', { result_id: 'guanyu' }],
    ['event', 'people_vote', { result_id: 'duel_guanyu' }],
    ['event', 'share_click', { test_name: 'people', method: 'link' }],
  ])
})

test('관우 페이지에 응원·투표 위젯이 들어간다', async () => {
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'guanyu' }) }))
  expect(html).toContain('응원하기')
  expect(html).toContain('관우 vs 조조, 일기토하면 누가 이길까?')
  expect(html).toContain('화용도에서 조조를 놓아 주다')
  expect(html).toContain('한 줄로')
  expect(html).not.toContain('%')
})

test('개인정보처리방침에 응원·투표 저장 안내', () => {
  const src = readFileSync('src/app/privacy/page.tsx', 'utf8')
  expect(src).toContain('삼국지 인물열전의 응원·투표는 고른 항목과 날짜, 그리고 기기·접속 정보를 되돌릴 수 없게 바꾼 값(해시)만 저장합니다. IP 주소와 쿠키 값 자체는 저장하지 않습니다.')
  expect(src).toContain('개정일자: 2026년 11월 3일')
})

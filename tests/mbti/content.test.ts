import { mbtiProfiles, monthlyFor, pageText } from '@/content/mbtiTypes'
import { MBTI_TYPES } from '@/lib/mbti/compat'

test('16유형이 모두 있다', () => {
  expect(Object.keys(mbtiProfiles).sort()).toEqual([...MBTI_TYPES].sort())
})

test.each(MBTI_TYPES)('%s: 필드 개수와 길이, 본문 1,500자 이상', (t) => {
  const p = mbtiProfiles[t]
  expect(p.nickname.length).toBeGreaterThan(3)
  expect(p.summary.length, 'summary').toBeGreaterThanOrEqual(200)
  expect(p.strengths).toHaveLength(3)
  expect(p.love.length, 'love').toBeGreaterThanOrEqual(100)
  expect(p.travel.domestic).toHaveLength(3)
  expect(p.travel.abroad).toHaveLength(3)
  expect(p.jobs).toHaveLength(5)
  expect(p.workStyle.length, 'workStyle').toBeGreaterThanOrEqual(80)
  expect(p.monthly.month).toBe('2026-11')
  expect(p.monthly.text.length, 'monthly').toBeGreaterThanOrEqual(100)
  expect(pageText(t).length, `${t} pageText`).toBeGreaterThanOrEqual(1500)
})

test('이달의 운세는 해당 달에만 보인다', () => {
  expect(monthlyFor('INFP', new Date(2026, 10, 15))).not.toBeNull()
  expect(monthlyFor('INFP', new Date(2026, 11, 1))).toBeNull()
  expect(monthlyFor('INFP', new Date(2026, 9, 31))).toBeNull()
})

test('유형끼리 summary·love 문장이 겹치지 않는다', () => {
  const seen = new Set<string>()
  for (const t of MBTI_TYPES) for (const s of [mbtiProfiles[t].summary, mbtiProfiles[t].love]) {
    expect(seen.has(s), t).toBe(false)
    seen.add(s)
  }
})

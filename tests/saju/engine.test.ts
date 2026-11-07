import { computeSaju, type SajuInput, type SajuResult } from '@/lib/saju/engine'
import { ELEMENTS, TEN_GODS } from '@/lib/saju/keys'
import { FORTUNE_YEAR } from '@/lib/fortuneYear'

const base: SajuInput = { year: 1990, month: 5, day: 15, hourSlot: 'mi', isLunar: false, isLeapMonth: false, gender: '남', asOfYear: 2027 }
const ok = (o: Partial<SajuInput>): SajuResult => {
  const r = computeSaju({ ...base, ...o })
  if (!r.ok) throw new Error('expected ok, got ' + r.reason)
  return r
}
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)
const k = (p: { korean: string } | null) => p?.korean

test('1990-05-15 미시 남: 경오·신사·경진·계미', () => {
  const r = ok({})
  expect([r.pillars.year, r.pillars.month, r.pillars.day, r.pillars.hour].map(k)).toEqual(['경오', '신사', '경진', '계미'])
  expect(r.pillars.year.hanja).toBe('庚午')
  expect(r.dayMaster).toMatchObject({ stem: '경', element: '금', yinYang: '양', key: 'gyeong' })
  expect(sum(r.elements)).toBe(8)
  expect(Object.keys(r.elements)).toEqual([...ELEMENTS])
  expect(sum(r.tenGods.counts)).toBe(7)
  expect(Object.keys(r.tenGods.counts)).toEqual([...TEN_GODS])
  expect(r.tenGods.top).toHaveLength(2)
  expect(r.daeun).toHaveLength(10)
  expect(r.daeun[0]).toMatchObject({ startAge: 7, countingAge: 8, forward: true, korean: '임오' })
  expect(r.basis).toMatchObject({ dayBoundary: 'midnight', dstApplied: false, trueSolarTime: false, hourKnown: true, boundaryWarning: null })
  expect(r.solar).toEqual({ year: 1990, month: 5, day: 15 })
})

test('여성은 역행: startAge 3, 경진', () => {
  const r = ok({ gender: '여' })
  expect(r.daeun[0]).toMatchObject({ startAge: 3, forward: false, korean: '경진' })
})

test('성별 없으면 대운 빈 배열', () => {
  expect(ok({ gender: null }).daeun).toEqual([])
})

test('현재 대운 표시: 37세는 3번째 이후 구간', () => {
  const r = ok({})
  const cur = r.daeun.filter((d) => d.isCurrent)
  expect(cur).toHaveLength(1)
  expect(cur[0].startAge).toBe(37)
})

test('시간 모름: 시주 없음, 6글자', () => {
  const r = ok({ hourSlot: null })
  expect(r.pillars.hour).toBeNull()
  expect(r.tenGods.byPillar.hour).toBeNull()
  expect(sum(r.elements)).toBe(6)
  expect(sum(r.tenGods.counts)).toBe(5)
  expect(r.basis.hourKnown).toBe(false)
})

test('입춘 경계: 2027-02-03 / 02-04 시간대별', () => {
  const t = { year: 2027, month: 2 }
  const r1 = ok({ ...t, day: 3, hourSlot: 'o' })
  expect([r1.pillars.year.korean, r1.pillars.month.korean]).toEqual(['병오', '신축'])
  const r2 = ok({ ...t, day: 4, hourSlot: 'in' })
  expect(r2.pillars.year.korean).toBe('병오')
  const r3 = ok({ ...t, day: 4, hourSlot: 'o' })
  expect([r3.pillars.year.korean, r3.pillars.month.korean]).toEqual(['정미', '임인'])
})

test('절입 당일 시간 모름: 정오 기준 + jeolip 경고', () => {
  const r = ok({ year: 2027, month: 2, day: 4, hourSlot: null })
  expect([r.pillars.year.korean, r.pillars.month.korean]).toEqual(['정미', '임인'])
  expect(r.basis.boundaryWarning).toEqual({ kind: 'jeolip', at: '10:46', alt: '병오년·신축월' })
})

test('절입 없는 날 시간 모름은 경고 없음', () => {
  expect(ok({ hourSlot: null }).basis.boundaryWarning).toBeNull()
})

test('밤 11~12시: 일주는 그 날짜, 시주 자시, midnight 경고', () => {
  const r = ok({ hourSlot: 'ja1' })
  expect(r.pillars.day.korean).toBe('경진')
  expect(r.pillars.hour?.korean).toBe('병자')
  expect(r.basis.boundaryWarning?.kind).toBe('midnight')
  expect(r.basis.boundaryWarning?.at).toBe('23:00')
})

test('서머타임 1988-07-01 00:30 → 일주 병진', () => {
  const r = ok({ year: 1988, month: 7, day: 1, hourSlot: 'ja2' })
  expect(r.pillars.day.korean).toBe('병진')
  expect(r.basis.dstApplied).toBe(true)
})

test('음력 1990-4-21 = 양력 1990-5-15', () => {
  const l = ok({ month: 4, day: 21, isLunar: true })
  const s = ok({})
  expect(l.solar).toEqual({ year: 1990, month: 5, day: 15 })
  expect(l.pillars).toEqual(s.pillars)
})

test('범위 밖은 range', () => {
  expect(computeSaju({ ...base, year: 1850 })).toEqual({ ok: false, reason: 'range' })
  expect(computeSaju({ ...base, year: 2101, isLunar: true, asOfYear: 2027 })).toEqual({ ok: false, reason: 'range' })
  expect(computeSaju({ ...base, year: 2030 })).toEqual({ ok: false, reason: 'range' })
})

test('없는 날짜는 invalid', () => {
  expect(computeSaju({ ...base, month: 2, day: 31 })).toEqual({ ok: false, reason: 'invalid' })
})

test('결정적', () => {
  expect(computeSaju(base)).toEqual(computeSaju(base))
})

test('세운 2027 정미, FORTUNE_YEAR와 일치', () => {
  const r = ok({})
  expect(r.seun.korean).toBe('정미')
  expect(r.seun.hanja).toBe('丁未')
  expect(r.seun.korean).toBe(FORTUNE_YEAR.간지)
  expect(r.seun.hanja).toBe(FORTUNE_YEAR.한자)
  expect(r.seun.stemTenGod).toBe('정관') // 경 ← 정
  expect(r.seun.dayBranchRelation).toEqual({ kind: '없음', strength: 'none' }) // 일지 진
})

test('일간 갑이면 세운 정은 상관', () => {
  // 1990-05-15가 아닌 갑일을 찾는다: 2024-02-10 = 갑진일
  const r = ok({ year: 2024, month: 2, day: 10, hourSlot: null, asOfYear: 2027 })
  expect(r.dayMaster.stem).toBe('갑')
  expect(r.seun.stemTenGod).toBe('상관')
})

test('십신 동률: 개수가 같으면 태어난 달(월지 → 월간) 십신을 먼저, 셋째와 같으면 tied', () => {
  for (const o of [{}, { year: 1995, hourSlot: null }, { year: 1988, month: 2, day: 3 }] as Partial<SajuInput>[]) {
    const r = ok(o)
    const [a, b] = r.tenGods.top
    const c = r.tenGods.counts
    expect(c[a]).toBeGreaterThanOrEqual(c[b])
    const third = TEN_GODS.filter((g) => g !== a && g !== b && c[g] > 0).sort((x, y) => c[y] - c[x])[0]
    expect(r.tenGods.tied).toBe(third !== undefined && c[third] === c[b])
    const m = r.tenGods.byPillar.month
    const tiedWithTop = TEN_GODS.filter((g) => c[g] === c[a])
    if (tiedWithTop.includes(m.branch)) expect(a).toBe(m.branch)
  }
})

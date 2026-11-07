import { computeFortune } from '@/lib/fortuneService'
import { computeSaju } from '@/lib/saju/engine'
import { ELEMENTS } from '@/lib/saju/keys'

const base = { year: 1990, month: 5, day: 15, isLunar: false, isLeapMonth: false }
const now = new Date(2026, 10, 7)

function run(hourSlot: 'mi' | null) {
  const r = computeFortune({ ...base, hourSlot }, now)
  if ('error' in r) throw new Error(r.error)
  return r.사주정보
}

test('네 기둥이 computeSaju와 같다', () => {
  const info = run('mi')
  const e = computeSaju({ ...base, hourSlot: 'mi', gender: null, asOfYear: 2027 })
  if (!e.ok) throw new Error('engine')
  expect(info.기둥).toEqual(e.pillars)
  expect(info.오행분포).toEqual(e.elements)
  expect(info.세운.korean).toBe('정미')
  expect(info.세운.year).toBe(2027)
  expect(info.사주).toEqual({ 년주: '경오', 월주: '신사', 일주: '경진' })
  expect(info.시주).toBe(e.pillars.hour!.korean)
})

test('시간을 모르면 시주가 없고 오행은 6글자 집계', () => {
  const info = run(null)
  expect(info.기둥.hour).toBeNull()
  expect(info.시주).toBeNull()
  expect(Object.values(info.오행분포).reduce((a, b) => a + b, 0)).toBe(6)
})

test('시간을 알면 오행은 8글자 집계, 강한오행은 최댓값이고 약한오행은 최솟값', () => {
  const info = run('mi')
  const counts = ELEMENTS.map((e) => info.오행분포[e])
  expect(counts.reduce((a, b) => a + b, 0)).toBe(8)
  expect(info.오행분포[info.강한오행 as keyof typeof info.오행분포]).toBe(Math.max(...counts))
  expect(info.오행분포[info.약한오행 as keyof typeof info.오행분포]).toBe(Math.min(...counts))
})

test('성별을 받지 않으므로 대운 정보는 결과에 없다', () => {
  expect(JSON.stringify(run('mi'))).not.toContain('daeun')
})

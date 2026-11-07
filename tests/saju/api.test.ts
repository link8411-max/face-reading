import { NextRequest } from 'next/server'
import { POST } from '@/app/api/saju/route'

const call = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/saju', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }))
const ok = { year: 1990, month: 5, day: 15, hourSlot: 'mi', isLunar: false, isLeapMonth: false, gender: '여' }

test('정상: 200, 네 기둥과 대운', async () => {
  const res = await call(ok)
  expect(res.status).toBe(200)
  const j = await res.json()
  expect(j.ok).toBe(true)
  expect(j.pillars.day.korean).toBe('경진')
  expect(j.daeun.length).toBeGreaterThanOrEqual(8)
  expect(j.seun.year).toBeGreaterThanOrEqual(2026)
})

test('시간 모름(null)과 음력', async () => {
  expect((await (await call({ ...ok, hourSlot: null })).json()).pillars.hour).toBeNull()
  const lunar = await (await call({ year: 1990, month: 4, day: 21, hourSlot: 'mi', isLunar: true, isLeapMonth: false, gender: '여' })).json()
  expect(lunar.solar).toEqual({ year: 1990, month: 5, day: 15 })
})

test.each([
  ['잘못된 날짜', { ...ok, month: 2, day: 31 }],
  ['성별 없음', { ...ok, gender: undefined }],
  ['성별 값 이상', { ...ok, gender: 'x' }],
  ['시간 칸 이상', { ...ok, hourSlot: 'zzz' }],
  ['숫자 아님', { ...ok, year: '1990' }],
])('%s: 400', async (_n, body) => {
  const res = await call(body)
  expect(res.status).toBe(400)
  expect((await res.json()).ok).toBe(false)
})

test('범위 밖 연도는 range', async () => {
  const res = await call({ ...ok, year: 1850 })
  expect(res.status).toBe(400)
  expect((await res.json()).reason).toBe('range')
})

test('JSON이 아니면 400', async () => {
  const res = await POST(new NextRequest('http://localhost/api/saju', { method: 'POST', body: 'x' }))
  expect(res.status).toBe(400)
})

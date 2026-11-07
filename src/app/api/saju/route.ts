import { NextRequest, NextResponse } from 'next/server'
import { computeSaju } from '@/lib/saju/engine'
import { isHourSlotKey, type HourSlotKey } from '@/lib/saju/keys'
import { validateBirthDate } from '@/lib/birthDate'

// 사주 계산. 생년월일·시간·성별은 로그에 남기지 않는다.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })
  }
  const { year, month, day, hourSlot, isLunar, isLeapMonth, gender } = body
  const bad = () => NextResponse.json({ ok: false, reason: 'invalid' }, { status: 400 })

  if (![year, month, day].every((n) => typeof n === 'number' && Number.isInteger(n))) return bad()
  if (gender !== '남' && gender !== '여') return bad()
  if (hourSlot !== null && hourSlot !== undefined && !isHourSlotKey(hourSlot)) return bad()
  const lunar = isLunar === true
  const check = validateBirthDate(
    { year: String(year), month: String(month), day: String(day) },
    new Date(),
    { lunar },
  )
  if (!check.ok) {
    // 연도가 범위 밖이면 화면이 안내를 따로 보여 줄 수 있게 range로 구분
    const outOfRange = (year as number) < 1900 || (year as number) > new Date().getFullYear()
    return NextResponse.json({ ok: false, reason: outOfRange ? 'range' : 'invalid' }, { status: 400 })
  }

  const asOfYear = new Date(Date.now() + 9 * 3600e3).getUTCFullYear()
  const result = computeSaju({
    year: year as number,
    month: month as number,
    day: day as number,
    hourSlot: (hourSlot ?? null) as HourSlotKey | null,
    isLunar: lunar,
    isLeapMonth: lunar && isLeapMonth === true,
    gender,
    asOfYear,
  })
  if (!result.ok) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}

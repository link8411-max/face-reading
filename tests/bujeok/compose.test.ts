import { expect, test } from 'vitest'
import { pickElement, elementFromBirth, partsFor, randomVariant } from '@/lib/bujeok/compose'
import { EL_KEYS, WISHES, VARIANTS, STYLES, type ElKey } from '@/lib/bujeok/keys'

test('가장 적은 기운이 하나면 그것', () => {
  expect(pickElement({ 목: 2, 화: 0, 토: 2, 금: 1, 수: 1 }, 'money', 15)).toBe('fire')
})

test('동률이면 소원의 기본 기운이 후보에 있을 때 그것', () => {
  expect(pickElement({ 목: 2, 화: 0, 토: 2, 금: 0, 수: 2 }, 'money', 15)).toBe('metal')
})

test('동률이고 기본 기운이 후보에 없으면 날짜 % 후보 수 (후보는 목화토금수 순)', () => {
  expect(pickElement({ 목: 0, 화: 0, 토: 2, 금: 2, 수: 2 }, 'money', 15)).toBe('fire')
  expect(pickElement({ 목: 0, 화: 0, 토: 2, 금: 2, 수: 2 }, 'money', 14)).toBe('wood')
})

test('없는 날짜는 null', () => {
  expect(elementFromBirth({ year: 1990, month: 2, day: 30, isLunar: false, isLeapMonth: false }, 'money')).toBeNull()
})

test('범위 밖 연도는 null', () => {
  expect(elementFromBirth({ year: 1800, month: 1, day: 1, isLunar: false, isLeapMonth: false }, 'money')).toBeNull()
})

test('같은 입력은 같은 결과', () => {
  const b = { year: 1990, month: 5, day: 17, isLunar: false, isLeapMonth: false }
  const a = elementFromBirth(b, 'love')
  expect(a).not.toBeNull()
  expect(elementFromBirth(b, 'love')).toBe(a)
})

test('분포: 1950~2010년 매달 1·15일, 소원 5개 전체에서 한 기운이 40%를 넘지 않는다', () => {
  const tally: Record<ElKey, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  let total = 0
  for (let y = 1950; y <= 2010; y++)
    for (let m = 1; m <= 12; m++)
      for (const d of [1, 15])
        for (const w of WISHES) {
          const el = elementFromBirth({ year: y, month: m, day: d, isLunar: false, isLeapMonth: false }, w)
          expect(el).not.toBeNull()
          tally[el!]++
          total++
        }
  const shares = Object.fromEntries(EL_KEYS.map((k) => [k, tally[k] / total]))
  for (const k of EL_KEYS) expect(shares[k], JSON.stringify(shares)).toBeLessThanOrEqual(0.4)
})

test('partsFor: variant 0..3이 (border, head) 네 조합을 한 번씩 낸다', () => {
  const seen = new Set<string>()
  for (let v = 0; v < VARIANTS; v++) {
    const p = partsFor({ style: STYLES[0], wish: 'money', el: 'metal', variant: v })
    seen.add(`${p.border}${p.head}`)
  }
  expect(seen.size).toBe(4)
})

test('randomVariant는 0..VARIANTS-1', () => {
  expect(randomVariant(() => 0)).toBe(0)
  expect(randomVariant(() => 0.999999)).toBe(VARIANTS - 1)
})

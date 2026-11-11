import { describe, expect, test } from 'vitest'
import { cleanName, bujeokCode, parseBujeokCode, bujeokGiftUrl, bujeokOgUrl, giftHeadline } from '@/lib/bujeok/link'
import { BANNED_NAMES } from '@/lib/bujeok/bannedNames'
import { STYLES, WISHES, EL_KEYS, VARIANTS, type BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 2 }

describe('cleanName', () => {
  test.each([['민지', '민지'], ['  민지 ', '민지'], ['Kim 민지', 'Kim 민지']])('통과 %s', (i, o) => expect(cleanName(i)).toBe(o))
  test.each(['', '   ', '가나다라마바사아자', '민지😀', '<b>민지</b>', '민지!', 123, null, undefined])('거절 %s', (i) => expect(cleanName(i)).toBeNull())
  test('금지어가 들어간 이름은 거절', () => {
    expect(BANNED_NAMES.length).toBeGreaterThanOrEqual(15)
    for (const b of BANNED_NAMES) expect(cleanName(b), b).toBeNull()
  })
  test('공백으로 금지어를 쪼개도 거절', () => {
    const b = BANNED_NAMES.find((w) => w.length >= 2)!
    expect(cleanName(`${b[0]} ${b.slice(1)}`)).toBeNull()
  })
})

describe('code', () => {
  test('200개 전부 왕복', () => {
    let n = 0
    for (const style of STYLES) for (const wish of WISHES) for (const el of EL_KEYS) for (let variant = 0; variant < VARIANTS; variant++) {
      const s = { style, wish, el, variant }
      expect(parseBujeokCode(bujeokCode(s))).toEqual(s)
      n++
    }
    expect(n).toBe(200)
  })
  test.each(['trad-money-metal-4', 'trad-money-metal--1', 'oil-money-metal-0', 'trad-money-metal', 'trad-money-metal-0-x', 'trad-money-metal-1.5', '', 'trad-money-metal-01', 'trad-money-metal- 1'])('잘못된 코드 "%s" → null', (c) => {
    expect(parseBujeokCode(c)).toBeNull()
  })
  test('코드 형식', () => expect(bujeokCode(spec)).toBe('trad-money-metal-2'))
})

describe('url', () => {
  test('선물 링크에 이름이 인코딩되고 다른 값은 없다', () => {
    const u = new URL(bujeokGiftUrl(spec, { to: '민지', from: '철수' }))
    expect(u.origin + u.pathname).toBe('https://unse-ai.com/bujeok/r/trad-money-metal-2')
    expect([...u.searchParams.keys()].sort()).toEqual(['from', 'to', 'utm_medium', 'utm_source'])
    expect(u.searchParams.get('to')).toBe('민지')
    expect(u.searchParams.get('from')).toBe('철수')
    expect(u.searchParams.get('utm_source')).toBe('share')
    expect(u.searchParams.get('utm_medium')).toBe('friend_link')
  })
  test('보내는 사람이 없으면 from 없음, 검사 못 넘긴 이름은 싣지 않는다', () => {
    const u = new URL(bujeokGiftUrl(spec, { to: '민지' }))
    expect(u.searchParams.has('from')).toBe(false)
    const bad = new URL(bujeokGiftUrl(spec, { to: '<b>', from: '민지😀' }))
    expect(bad.searchParams.has('to')).toBe(false)
    expect(bad.searchParams.has('from')).toBe(false)
  })
  test('미리보기 주소에 이름이 없다', () => {
    const o = bujeokOgUrl(spec)
    expect(o).not.toMatch(/to=|from=/)
    expect(o).toContain('/api/og/result?kind=bujeok&style=trad&wish=money&el=metal')
  })
  test('giftHeadline', () => {
    expect(giftHeadline('민지')).toBe('민지님께 부적이 도착했어요')
    expect(giftHeadline(null)).toBe('부적이 도착했어요')
  })
})

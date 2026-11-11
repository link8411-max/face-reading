import { describe, expect, test } from 'vitest'
import { cleanName, bujeokCode, parseBujeokCode, bujeokGiftUrl, bujeokMineUrl, bujeokOgUrl, giftHeadline, mineHeadline, parseNameHash } from '@/lib/bujeok/link'
import { BANNED_NAMES } from '@/lib/bujeok/bannedNames'
import { DEFAULT_SPINE, encodeStroke } from '@/lib/bujeok/stroke'
import { STYLES, WISHES, EL_KEYS, VARIANTS, FINISHES, type BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 2, finish: 'gold' }

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
  test('1320개(2화풍 × 11소원 × 5기운 × 4변형 × 3마감) 전부 왕복', () => {
    let n = 0
    for (const style of STYLES) for (const wish of WISHES) for (const el of EL_KEYS) for (let variant = 0; variant < VARIANTS; variant++) for (const finish of FINISHES) {
      const s = { style, wish, el, variant, finish }
      expect(parseBujeokCode(bujeokCode(s))).toEqual(s)
      n++
    }
    expect(n).toBe(1320)
  })
  test.each(['trad-money-metal-4', 'trad-money-metal--1', 'oil-money-metal-0', 'trad-money-metal', 'trad-money-metal-0-x', 'trad-money-metal-1.5', '', 'trad-money-metal-01', 'trad-money-metal- 1', 'trad-money-metal-0', 'trad-money-metal-0-foil', 'trad-money-metal-0-gold-x', 'trad-money-metal-0-GOLD', 'trad-money-metal-4-gold'])('잘못된 코드 "%s" → null', (c) => {
    expect(parseBujeokCode(c)).toBeNull()
  })
  test('5칸 코드는 획이 없다', () => {
    expect(parseBujeokCode('trad-money-metal-2-gold')!.stroke).toBeUndefined()
    expect(parseBujeokCode('trad-pass-wood-0-gold')).toEqual({ style: 'trad', wish: 'pass', el: 'wood', variant: 0, finish: 'gold' })
  })
  test('6칸(획) 왕복', () => {
    const stroke = encodeStroke(DEFAULT_SPINE)
    const s: BujeokSpec = { ...spec, stroke }
    expect(bujeokCode(s)).toBe(`trad-money-metal-2-gold-${stroke}`)
    expect(parseBujeokCode(bujeokCode(s))).toEqual(s)
  })
  test('cute는 획을 싣지 않고, cute+6칸·망가진 6칸·7칸은 null', () => {
    const stroke = encodeStroke(DEFAULT_SPINE)
    expect(bujeokCode({ ...spec, style: 'cute', stroke })).toBe('cute-money-metal-2-gold')
    expect(parseBujeokCode(`cute-money-metal-2-gold-${stroke}`)).toBeNull()
    expect(parseBujeokCode('trad-pass-wood-0-gold-zzz')).toBeNull()
    expect(parseBujeokCode(`trad-money-metal-2-gold-${stroke}-${stroke}`)).toBeNull()
    expect(parseBujeokCode('trad-money-metal-2-gold-S' + 'a'.repeat(24))).toBeNull()
  })
  test('코드 형식', () => expect(bujeokCode(spec)).toBe('trad-money-metal-2-gold'))
})

describe('url', () => {
  test('선물 링크: 이름은 # 뒤에만 있고 쿼리에는 utm만 있다', () => {
    const raw = bujeokGiftUrl(spec, { to: '민지', from: '철수' })
    const u = new URL(raw)
    expect(u.origin + u.pathname).toBe('https://unse-ai.com/bujeok/r/trad-money-metal-2-gold')
    expect([...u.searchParams.keys()].sort()).toEqual(['utm_medium', 'utm_source'])
    expect(u.search).not.toMatch(/민지|철수|%EB/)
    const [before, after] = raw.split('#')
    expect(before).not.toMatch(/민지|철수|%EB%AF|to=|from=/)
    expect(after).toBe('to=%EB%AF%BC%EC%A7%80&from=%EC%B2%A0%EC%88%98')
    expect(parseNameHash(u.hash)).toEqual({ to: '민지', from: '철수' })
  })
  test('보내는 사람이 없으면 from 없음, 검사 못 넘긴 이름은 싣지 않는다', () => {
    expect(bujeokGiftUrl(spec, { to: '민지' }).split('#')[1]).toBe('to=%EB%AF%BC%EC%A7%80')
    const bad = bujeokGiftUrl(spec, { to: '<b>', from: '민지😀' })
    expect(bad).not.toContain('#')
  })
  test('내 부적 링크: me=1, 이름은 # 뒤', () => {
    const raw = bujeokMineUrl(spec, '민지')
    expect(raw.split('#')[0]).toBe('https://unse-ai.com/bujeok/r/trad-money-metal-2-gold?me=1')
    expect(raw.split('#')[1]).toBe('to=%EB%AF%BC%EC%A7%80')
    expect(bujeokMineUrl(spec, null)).toBe('https://unse-ai.com/bujeok/r/trad-money-metal-2-gold?me=1')
    expect(bujeokMineUrl(spec, '민지😀')).not.toContain('#')
  })
  test('미리보기 주소에 이름이 없다', () => {
    const o = bujeokOgUrl(spec)
    expect(o).not.toMatch(/to=|from=/)
    expect(o).toContain('/api/og/result?kind=bujeok&style=trad&wish=money&finish=gold')
    expect(o).not.toContain('el=')
  })
  test('giftHeadline·mineHeadline', () => {
    expect(giftHeadline('민지')).toBe('민지님께 부적이 도착했어요')
    expect(giftHeadline(null)).toBe('부적이 도착했어요')
    expect(mineHeadline('민지')).toBe('민지님의 부적')
    expect(mineHeadline(null)).toBe('나의 부적')
  })
})

describe('parseNameHash', () => {
  test('정상, # 유무, 한쪽만', () => {
    expect(parseNameHash('#to=%EB%AF%BC%EC%A7%80&from=%EC%B2%A0%EC%88%98')).toEqual({ to: '민지', from: '철수' })
    expect(parseNameHash('to=%EB%AF%BC%EC%A7%80')).toEqual({ to: '민지', from: null })
    expect(parseNameHash('')).toEqual({ to: null, from: null })
    expect(parseNameHash('#')).toEqual({ to: null, from: null })
  })
  test('9자·이모지·태그·공백·깨진 인코딩은 이름 없음', () => {
    for (const bad of ['가나다라마바사아자', '민지😀', '<b>민지</b>', '   ']) {
      expect(parseNameHash(`#to=${encodeURIComponent(bad)}&from=${encodeURIComponent(bad)}`)).toEqual({ to: null, from: null })
    }
    expect(parseNameHash('#to=%E0%A4%A&from=%')).toEqual({ to: null, from: null })
  })
})

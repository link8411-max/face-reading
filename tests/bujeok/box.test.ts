// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { breakStorageAccess, installStorage, restoreStorage, type MemStorage } from '../exam/storageStub'
import { addToBox, loadBox, removeFromBox, boxItemHref, type BoxItem } from '@/lib/bujeok/box'

const KEY = 'bujeok-box-v1'
const A = 'trad-money-metal-1-gold'
const B = 'cute-love-fire-2-holo'
const item = (over: Partial<Omit<BoxItem, 'savedAt'>> = {}) => ({ code: A, to: '민지' as string | null, from: null as string | null, kind: 'received' as const, ...over })

let store: MemStorage
beforeEach(() => {
  store = installStorage()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-11T03:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  restoreStorage()
})

describe('box', () => {
  test('비어 있으면 []', () => expect(loadBox()).toEqual([]))

  test('넣으면 최신순으로 읽힌다 (저장 시각 포함)', () => {
    addToBox(item({ code: A }))
    vi.setSystemTime(new Date('2026-11-12T03:00:00Z'))
    addToBox(item({ code: B, kind: 'mine', to: null }))
    const got = loadBox()!
    expect(got.map((i) => i.code)).toEqual([B, A])
    expect(got[0]).toEqual({ code: B, to: null, from: null, kind: 'mine', savedAt: Date.parse('2026-11-12T03:00:00Z') })
  })

  test('같은 코드·이름·종류는 한 번만(앞으로 올라온다), 하나라도 다르면 따로', () => {
    addToBox(item())
    addToBox(item({ code: B }))
    vi.setSystemTime(new Date('2026-11-12T03:00:00Z'))
    addToBox(item())
    expect(loadBox()!.map((i) => i.code)).toEqual([A, B])
    expect(loadBox()![0].savedAt).toBe(Date.parse('2026-11-12T03:00:00Z'))
    addToBox(item({ to: '철수' }))
    addToBox(item({ from: '영희' }))
    addToBox(item({ kind: 'sent' }))
    expect(loadBox()!.length).toBe(5)
  })

  test('60개까지만, 넘치면 오래된 것부터 지운다', () => {
    for (let n = 0; n < 65; n++) addToBox(item({ to: `이름${n}` }))
    const got = loadBox()!
    expect(got.length).toBe(60)
    expect(got[0].to).toBe('이름64')
    expect(got[59].to).toBe('이름5')
  })

  test('지우기는 그 항목만', () => {
    addToBox(item())
    addToBox(item({ kind: 'sent' }))
    removeFromBox(item())
    expect(loadBox()!.map((i) => i.kind)).toEqual(['sent'])
    removeFromBox(item({ code: B })) // 없는 항목은 아무 일도 없다
    expect(loadBox()!.length).toBe(1)
  })

  test('깨진 JSON은 빈 상자로 읽고 다음에 넣을 때 덮어쓴다', () => {
    store.setItem(KEY, '{not json')
    expect(loadBox()).toEqual([])
    addToBox(item())
    expect(loadBox()!.length).toBe(1)
    store.setItem(KEY, '"문자열"')
    expect(loadBox()).toEqual([])
    store.setItem(KEY, '{"a":1}')
    expect(loadBox()).toEqual([])
  })

  test('코드·이름·종류가 틀린 항목은 읽을 때 버린다', () => {
    const good = { code: A, to: '민지', from: null, kind: 'mine', savedAt: 5 }
    store.setItem(KEY, JSON.stringify([
      good,
      { ...good, code: 'trad-money-metal-9-gold' },
      { ...good, code: 'x' },
      { ...good, to: '<b>민지</b>' },
      { ...good, from: '가나다라마바사아자' },
      { ...good, to: '민지😀' },
      { ...good, kind: 'friend' },
      { ...good, savedAt: 'x' },
      null,
      'str',
      42,
    ]))
    expect(loadBox()).toEqual([good])
  })

  test('넣을 때도 검사한다: 틀린 코드·이름은 저장하지 않는다', () => {
    addToBox(item({ code: 'bad' }))
    addToBox(item({ to: '<b>' }))
    addToBox({ ...item(), kind: 'x' as never })
    expect(loadBox()).toEqual([])
  })

  test('생년월일 같은 다른 필드는 저장하지 않는다', () => {
    addToBox({ ...item(), birth: { year: 1990 }, year: 1990, birthDate: '1990-01-01' } as never)
    const raw = store.getItem(KEY)!
    expect(raw).not.toMatch(/birth|year|1990/)
    expect(Object.keys(JSON.parse(raw)[0]).sort()).toEqual(['code', 'from', 'kind', 'savedAt', 'to'])
    // 읽을 때도 모르는 필드는 버린다
    store.setItem(KEY, JSON.stringify([{ code: A, to: null, from: null, kind: 'mine', savedAt: 1, birth: '1990' }]))
    expect(Object.keys(loadBox()![0]).sort()).toEqual(['code', 'from', 'kind', 'savedAt', 'to'])
  })

  test('저장소를 못 쓰면 loadBox는 null이고 넣기·지우기는 던지지 않는다', () => {
    vi.spyOn(store, 'getItem').mockImplementation(() => { throw new Error('denied') })
    vi.spyOn(store, 'setItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadBox()).toBeNull()
    expect(() => addToBox(item())).not.toThrow()
    expect(() => removeFromBox(item())).not.toThrow()
  })

  test('localStorage 접근 자체가 던져도(사생활 보호 창) null', () => {
    breakStorageAccess()
    expect(loadBox()).toBeNull()
    expect(() => addToBox(item())).not.toThrow()
    expect(() => removeFromBox(item())).not.toThrow()
  })

  test('쓰기만 실패해도(용량 초과) 던지지 않는다', () => {
    vi.spyOn(store, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => addToBox(item())).not.toThrow()
    expect(loadBox()).toEqual([])
  })

  test('링크: 내 부적은 ?me=1, 받은·보낸 부적은 그대로. 이름은 # 뒤', () => {
    expect(boxItemHref({ code: A, to: '민지', from: null, kind: 'mine' })).toBe(`/bujeok/r/${A}?me=1#to=%EB%AF%BC%EC%A7%80`)
    expect(boxItemHref({ code: A, to: '민지', from: '철수', kind: 'received' })).toBe(`/bujeok/r/${A}#to=%EB%AF%BC%EC%A7%80&from=%EC%B2%A0%EC%88%98`)
    expect(boxItemHref({ code: A, to: null, from: null, kind: 'sent' })).toBe(`/bujeok/r/${A}`)
  })
})

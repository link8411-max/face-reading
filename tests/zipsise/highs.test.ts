import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import fixture from './fixtures/highs.json'
import { fetchWeeklyHigh, formatMan, pickWeeklyHigh } from '@/lib/zipsise/highs'

// 픽스처는 2026-11-10에 받은 실제 파일(https://…r2.dev/v1/highs/recent.json)의 앞 3건이다.
// 확인한 단위: amount·prev_max·jump는 만원(예: 159500 = 15억 9,500만), deal_date는 YYYY-MM-DD.
const items = fixture.items as Record<string, unknown>[]
const raw = (over: Record<string, unknown>[] = []) => ({ ...fixture, items: [...over, ...items] })

describe('formatMan (만원 → 억·만 표기)', () => {
  test.each([
    [159500, '15억 9,500만'],
    [58000, '5억 8,000만'],
    [100000, '10억'],
    [9000, '9,000만'],
    [253000, '25억 3,000만'],
    [10500, '1억 500만'],
  ])('%d → %s', (v, out) => expect(formatMan(v)).toBe(out))
})

describe('pickWeeklyHigh', () => {
  test('실제 데이터: 최근 7일 안에서 jump가 가장 큰 한 건', () => {
    const h = pickWeeklyHigh(fixture, '2026-11-11')!
    expect(h).toEqual({ aptName: '인덕원 센트럴 자이 2단지', regionName: '경기 의왕', amountText: '15억 9,500만', jumpText: '+1억 500만', dealDate: '2026-11-09' })
  })
  test('오늘 포함 7일: 6일 전은 들어가고 7일 전은 빠진다', () => {
    expect(pickWeeklyHigh(fixture, '2026-11-15')).not.toBeNull() // 11-09는 6일 전
    expect(pickWeeklyHigh(fixture, '2026-11-16')).toBeNull() // 7일 전
  })
  test('7일 밖 거래만 있으면 null', () => {
    expect(pickWeeklyHigh(fixture, '2026-12-25')).toBeNull()
  })
  test('동률이면 apt_name 가나다순', () => {
    const a = { ...items[1], apt_name: '나단지', jump: 99999 }
    const b = { ...items[1], apt_name: '가단지', jump: 99999 }
    expect(pickWeeklyHigh(raw([a, b]), '2026-11-11')!.aptName).toBe('가단지')
    expect(pickWeeklyHigh(raw([b, a]), '2026-11-11')!.aptName).toBe('가단지')
  })
  test('정정 의심(held)·공유 불가(shareable false) 거래는 고르지 않는다', () => {
    const held = { ...items[0], apt_name: '정정의심', jump: 999999, held: true }
    const no = { ...items[0], apt_name: '공유불가', jump: 999998, shareable: false }
    expect(pickWeeklyHigh(raw([held, no]), '2026-11-11')!.aptName).toBe('인덕원 센트럴 자이 2단지')
  })
  test('오른 금액이 0 이하이거나 숫자가 아닌 건은 건너뛴다', () => {
    const bad = [{ ...items[0], jump: 0 }, { ...items[0], jump: '10500' }, { ...items[0], amount: -1 }]
    expect(pickWeeklyHigh({ items: bad }, '2026-11-11')).toBeNull()
  })
  test('깨진 항목이 섞여 있어도 멀쩡한 항목으로 고른다', () => {
    expect(pickWeeklyHigh({ items: [null, 'x', {}, ...items] }, '2026-11-11')!.aptName).toBe('인덕원 센트럴 자이 2단지')
  })
  test.each([null, 'x', {}, { items: 'x' }, { items: [] }, { items: [{}] }, { items: [{ apt_name: '', amount: 1, jump: 1, deal_date: '2026-11-10' }] }, { items: [{ apt_name: '가', region_name: '서울', amount: 1, jump: 1, deal_date: '어제' }] }])(
    '깨진 입력 %j → null, throw 없음',
    (r) => expect(pickWeeklyHigh(r, '2026-11-11')).toBeNull(),
  )
})

describe('fetchWeeklyHigh', () => {
  const realFetch = globalThis.fetch
  beforeEach(() => {
    vi.stubEnv('ZIPSISE_DATA_URL', 'https://example.test/')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-11T03:00:00Z'))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
    globalThis.fetch = realFetch
  })

  test('환경변수가 없으면 null이고 요청도 하지 않는다', async () => {
    vi.stubEnv('ZIPSISE_DATA_URL', '')
    const f = vi.fn()
    globalThis.fetch = f as unknown as typeof fetch
    expect(await fetchWeeklyHigh()).toBeNull()
    expect(f).not.toHaveBeenCalled()
  })
  test('정상: 경로와 1시간 캐시 옵션으로 읽고 한 건을 돌려준다', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }))
    globalThis.fetch = f as unknown as typeof fetch
    const h = await fetchWeeklyHigh()
    expect(h?.aptName).toBe('인덕원 센트럴 자이 2단지')
    const [url, init] = f.mock.calls[0] as unknown as [string, { next?: { revalidate?: number } }]
    expect(url).toBe('https://example.test/v1/highs/recent.json')
    expect(init.next?.revalidate).toBe(3600)
  })
  test('500이면 null', async () => {
    globalThis.fetch = vi.fn(async () => new Response('boom', { status: 500 })) as unknown as typeof fetch
    expect(await fetchWeeklyHigh()).toBeNull()
  })
  test('fetch가 던지면 null', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('network') }) as unknown as typeof fetch
    expect(await fetchWeeklyHigh()).toBeNull()
  })
  test('JSON이 아니면 null', async () => {
    globalThis.fetch = vi.fn(async () => new Response('<html>', { status: 200 })) as unknown as typeof fetch
    expect(await fetchWeeklyHigh()).toBeNull()
  })
})

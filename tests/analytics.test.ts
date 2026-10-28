import { readFileSync } from 'node:fs'
import { track, GA_ID } from '@/lib/analytics'

type W = { gtag?: (...a: unknown[]) => void }
const calls: unknown[][] = []
beforeEach(() => {
  calls.length = 0
  ;(globalThis as unknown as { window: W }).window = { gtag: (...a: unknown[]) => calls.push(a) }
})
afterAll(() => { delete (globalThis as unknown as { window?: W }).window })

test('측정 ID', () => {
  expect(GA_ID).toBe('G-L99JPMPT9D')
})

test('허용된 이벤트·파라미터만 gtag로 보낸다', () => {
  track('result_view', { test_name: 'animal', result_id: 'fox' })
  expect(calls).toEqual([['event', 'result_view', { test_name: 'animal', result_id: 'fox' }]])
})

test('개인정보가 될 수 있는 값은 버린다 (생년월일·숫자 4자리 이상·허용 안 된 키)', () => {
  track('result_view', { test_name: 'fortune', result_id: '1990-05-15' })
  track('fortune_submit', { test_name: 'fortune', birth: '19900515' } as never)
  track('result_view', { test_name: 'samguk', result_id: 'caocao' })
  expect(calls).toEqual([
    ['event', 'result_view', { test_name: 'fortune' }],
    ['event', 'fortune_submit', { test_name: 'fortune' }],
    ['event', 'result_view', { test_name: 'samguk', result_id: 'caocao' }],
  ])
})

test('결과 키는 한글 유형 이름도 허용한다(관상 재물상, 띠 양)', () => {
  track('result_view', { test_name: 'face', result_id: '재물상' })
  expect(calls[0][2]).toEqual({ test_name: 'face', result_id: '재물상' })
})

test('gtag가 없으면(광고 차단·서버) 아무 일도 하지 않는다', () => {
  ;(globalThis as unknown as { window: W }).window = {}
  expect(() => track('test_start', { test_name: 'face' })).not.toThrow()
})

test('레이아웃은 gtag를 afterInteractive로 한 번 불러온다', () => {
  const src = readFileSync('src/app/layout.tsx', 'utf8')
  expect(src).toContain('googletagmanager.com/gtag/js?id=${GA_ID}')
  expect(src).toContain('strategy="afterInteractive"')
})

test('개인정보처리방침에 GA 수집 항목과 사진·생년월일 미수집을 밝힌다', () => {
  const src = readFileSync('src/app/privacy/page.tsx', 'utf8')
  expect(src).toContain('Google 애널리틱스')
  expect(src).toMatch(/사진[^<]*생년월일[^<]*수집하지 않/)
})

test('개인정보처리방침에 일기토 플레이 기록 수집 항목을 밝힌다', () => {
  const src = readFileSync('src/app/privacy/page.tsx', 'utf8')
  expect(src).toMatch(/일기토[^<]*플레이 기록[^<]*시작 장수[^<]*도달 단계[^<]*기기 종류/)
  expect(src).toContain('IP 주소는 저장하지 않습니다')
})

test('일기토 퍼널 이벤트는 result_id로만 값을 보내고 허용 키 밖의 값은 버린다', () => {
  track('duel_wave', { test_name: 'duel', result_id: 'w06' })
  track('duel_end', { test_name: 'duel', result_id: 'guanyu_l_w18' })
  track('duel_resume', { test_name: 'duel' })
  track('duel_abandon', { test_name: 'duel' })
  expect(calls.slice(-4)).toEqual([
    ['event', 'duel_wave', { test_name: 'duel', result_id: 'w06' }],
    ['event', 'duel_end', { test_name: 'duel', result_id: 'guanyu_l_w18' }],
    ['event', 'duel_resume', { test_name: 'duel' }],
    ['event', 'duel_abandon', { test_name: 'duel' }],
  ])
})

test('GA가 아직 준비 전이면 이벤트를 모아 두었다가 준비되면 보낸다 (첫 화면 이벤트 유실 방지)', async () => {
  vi.useFakeTimers()
  try {
    vi.resetModules()
    const { track: freshTrack } = await import('@/lib/analytics')
    const w = (globalThis as unknown as { window: W }).window
    delete w.gtag
    freshTrack('shared_landing', { test_name: 'animal', result_id: 'cat' })
    expect(calls).toEqual([])
    w.gtag = (...a: unknown[]) => calls.push(a)
    await vi.advanceTimersByTimeAsync(500)
    expect(calls).toEqual([['event', 'shared_landing', { test_name: 'animal', result_id: 'cat' }]])
  } finally {
    vi.useRealTimers()
  }
})

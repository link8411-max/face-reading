// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`)
  },
}))
const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))
const shareResult = vi.fn<(...a: unknown[]) => Promise<string>>(async () => 'shared_link')
vi.mock('@/lib/share', () => ({ shareResult: (...a: unknown[]) => shareResult(...a), SHARE_NOTICE: { copied: '복사했어요', failed: '실패' } }))

import BujeokClient from '@/components/bujeok/BujeokClient'
import GiftLanding from '@/components/bujeok/GiftLanding'
import BujeokPage from '@/app/(ko)/bujeok/page'
import GiftPage, { generateMetadata } from '@/app/(ko)/bujeok/r/[code]/page'
import { breakStorageAccess, installStorage, restoreStorage } from '../exam/storageStub'
import { loadBox } from '@/lib/bujeok/box'
import { kakaoFeed } from '@/lib/kakao'
import { bujeokCode, bujeokGiftUrl, parseBujeokCode } from '@/lib/bujeok/link'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 1, finish: 'gold' }

beforeEach(() => {
  installStorage()
  track.mockClear()
  shareResult.mockClear()
  window.location.hash = ''
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  restoreStorage()
})

const skipRite = () => {
  const b = screen.queryByRole('button', { name: '그냥 완성하기' })
  if (b) fireEvent.click(b)
}
const make = () => screen.getByRole('button', { name: /이 부적 (받기|선물하기)/ }) as HTMLButtonElement
const open = (name: RegExp) => {
  const b = screen.getByRole('button', { name })
  if (b.getAttribute('aria-expanded') !== 'true') fireEvent.click(b)
}
const STYLE_FINISH = ['전통', '귀여운', '종이', '금박', '홀로그램']
const pick = (name: string) => {
  if (STYLE_FINISH.includes(name)) {
    open(/그림 바꾸기/)
    fireEvent.click(screen.getByRole('radio', { name }))
  } else fireEvent.click(screen.getByRole('button', { name }))
}
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

// --- 선물 모드 폼 ---
test('선물 모드에서는 받는 사람 이름이 없으면 만들기 비활성이고 생년월일 칸이 없다', () => {
  render(<BujeokClient initial={{ mode: 'gift' }} />)
  pick('재물')
  pick('전통')
  expect(make().disabled).toBe(true)
  expect(screen.queryByLabelText('년도')).toBeNull()
  expect(screen.queryByText('음력')).toBeNull()
  type('받는 사람 이름', '민지')
  expect(make().disabled).toBe(false)
  type('받는 사람 이름', '<b>x</b>')
  expect(make().disabled).toBe(true)
  expect(screen.getByText(/이름은/)).toBeTruthy()
})

test('선물 모드: 보내는 사람 이름은 선택이지만 틀린 이름이면 막는다', () => {
  render(<BujeokClient initial={{ mode: 'gift' }} />)
  pick('합격')
  pick('귀여운')
  type('받는 사람 이름', '민지')
  expect(make().disabled).toBe(false)
  type('보내는 사람 이름', '철수😀')
  expect(make().disabled).toBe(true)
  type('보내는 사람 이름', '철수')
  expect(make().disabled).toBe(false)
})

test('내 부적 모드와 선물 모드를 폼에서 바꿀 수 있다', () => {
  render(<BujeokClient />)
  open(/내 사주로 맞추기/)
  expect(screen.getByLabelText('년도')).toBeTruthy()
  fireEvent.click(screen.getByRole('radio', { name: '선물하기' }))
  expect(screen.queryByLabelText('년도')).toBeNull()
  expect(screen.getByLabelText('받는 사람 이름')).toBeTruthy()
})

test('initial.finish가 마감을 미리 고른다', () => {
  render(<BujeokClient initial={{ finish: 'holo' }} />)
  open(/그림 바꾸기/)
  expect(screen.getByRole('radio', { name: '홀로그램' }).getAttribute('aria-checked')).toBe('true')
})

test('선물 완성 화면: 카드(받는 사람 이름 뒷면)와 "링크로 보내기"가 있고, 공유 링크는 bujeokGiftUrl과 같다', async () => {
  render(<BujeokClient initial={{ mode: 'gift' }} />)
  pick('연애')
  pick('귀여운')
  pick('종이')
  type('받는 사람 이름', '민지')
  type('보내는 사람 이름', '철수')
  fireEvent.click(make())
  skipRite()
  await screen.findByTestId('bujeok-card')
  expect(screen.queryByRole('button', { name: '공유하기' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '링크로 보내기' }))
  await waitFor(() => expect(shareResult).toHaveBeenCalledTimes(1))
  const arg = shareResult.mock.calls[0][0] as { url: string; text: string }
  const code = new URL(arg.url).pathname.split('/').pop()!
  const got = parseBujeokCode(code)!
  expect(got).toMatchObject({ style: 'cute', wish: 'love', finish: 'paper' })
  expect((arg as { file?: unknown }).file).toBeNull() // 링크 우선: 그림 파일을 같이 보내지 않는다
  expect(arg.url).toBe(bujeokGiftUrl(got, { to: '민지', from: '철수' }))
  expect(arg.url).not.toMatch(/birth|year|19\d\d/)
  expect(arg.url.split('#')[0]).not.toMatch(/민지|철수|%EB/)
  expect(arg.url.split('#')[1]).toContain('to=')
  expect(arg.text).toContain('민지님께 부적이 도착했어요')
  // 카카오톡 카드: 제목은 보내는 화면에서 만든 문구(이름 포함), 링크는 해시 주소
  const card = kakaoFeed({ title: 't', text: arg.text, url: arg.url, imageUrl: 'i' })
  expect(card.content.title).toBe('민지님께 부적이 도착했어요')
  expect(card.content.link.webUrl).toBe(arg.url)
  expect(card.content.link.webUrl).toContain('#to=')
  // 이름은 GA에 가지 않는다
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/민지|철수/)
  expect(track).toHaveBeenCalledWith('result_view', { test_name: 'bujeok', result_id: 'cute_love' })
})

// --- 착지 화면 ---
const setHash = (h: string) => { window.location.hash = h }
const H = (to?: string, from?: string) => '#' + [to && `to=${encodeURIComponent(to)}`, from && `from=${encodeURIComponent(from)}`].filter(Boolean).join('&')

test('착지: 해시 to=민지 → 마운트 뒤 "민지님께 부적이 도착했어요", 열어 보기를 누르면 카드와 "철수님이 보냈어요"와 세 버튼', () => {
  setHash(H('민지', '철수'))
  render(<GiftLanding spec={spec} />)
  expect(screen.getByText('민지님께 부적이 도착했어요')).toBeTruthy()
  expect(screen.queryByTestId('bujeok-card')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '그냥 완성하기' }))
  expect(screen.getByTestId('bujeok-card')).toBeTruthy()
  expect(screen.queryByRole('button', { name: '그냥 완성하기' })).toBeNull()
  expect(screen.getByText('철수님이 보냈어요')).toBeTruthy()
  expect(screen.getByRole('button', { name: '잠금화면으로 간직하기' })).toBeTruthy()
  expect(screen.getByRole('link', { name: '나도 하나 보내기' }).getAttribute('href')).toBe('/bujeok?mode=gift&style=trad&finish=gold')
  expect(screen.getByRole('link', { name: '내 부적 만들기' }).getAttribute('href')).toBe('/bujeok?wish=money&style=trad&finish=gold')
})

test('착지: 이름이 없으면 "부적이 도착했어요", 보낸 사람 줄도 없다', () => {
  render(<GiftLanding spec={spec} />)
  expect(screen.getByText('부적이 도착했어요')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '그냥 완성하기' }))
  expect(screen.queryByText(/님이 보냈어요/)).toBeNull()
})

test('착지: 카카오가 해시(#to=…)를 떼 가도 이름 없이 정상으로 열린다', () => {
  for (const h of ['', '#', '#x=1']) {
    setHash(h)
    const { unmount } = render(<GiftLanding spec={spec} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('부적이 도착했어요')
    fireEvent.click(screen.getByRole('button', { name: '그냥 완성하기' }))
    expect(screen.getByTestId('bujeok-card')).toBeTruthy()
    expect(screen.queryByText(/님이 보냈어요/)).toBeNull()
    unmount()
  }
})

test('착지: 9자·이모지·태그 해시는 이름 없이', () => {
  for (const bad of ['가나다라마바사아자', '민지😀', '<b>민지</b>']) {
    setHash(H(bad, bad))
    const { unmount } = render(<GiftLanding spec={spec} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('부적이 도착했어요')
    expect(document.body.textContent).not.toContain(bad)
    unmount()
  }
})

test('착지: shared_landing 이벤트는 result_id `<화풍>_<소원>`이고 이름이 없다', () => {
  setHash(H('민지', '철수'))
  render(<GiftLanding spec={spec} />)
  expect(track).toHaveBeenCalledWith('shared_landing', { test_name: 'bujeok', result_id: 'trad_money' })
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/민지|철수/)
})

// --- 부적함 저장 / 내 부적 착지 ---
test('받은 선물 착지를 열면 부적함에 received로 한 번만 저장된다 (이름은 해시에서)', () => {
  setHash(H('민지', '철수'))
  const { unmount } = render(<GiftLanding spec={spec} />)
  expect(loadBox()).toMatchObject([{ code: bujeokCode(spec), to: '민지', from: '철수', kind: 'received' }])
  unmount()
  render(<GiftLanding spec={spec} />)
  expect(loadBox()!.length).toBe(1) // 같은 링크를 다시 열어도 한 번만
})

test('이름이 잘못된 선물도 이름 없이 저장하고, 저장소를 못 써도 착지는 정상', () => {
  setHash(H('민지😀'))
  render(<GiftLanding spec={spec} />)
  expect(loadBox()).toMatchObject([{ to: null, from: null, kind: 'received' }])
  cleanup()
  breakStorageAccess()
  render(<GiftLanding spec={spec} />)
  expect(screen.getByRole('button', { name: '그냥 완성하기' })).toBeTruthy()
})

test('내 부적 착지(me=1): 열어 보기 없이 바로 카드, "○○님의 부적", 버튼은 간직하기 · 친구에게도 하나 선물하기 · 내 부적함, 부적함에는 저장하지 않는다', () => {
  setHash(H('민지'))
  render(<GiftLanding spec={spec} mine />)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('민지님의 부적')
  expect(screen.queryByRole('button', { name: '그냥 완성하기' })).toBeNull()
  expect(screen.getByTestId('bujeok-card')).toBeTruthy()
  expect(screen.getByRole('button', { name: '잠금화면으로 간직하기' })).toBeTruthy()
  expect(screen.getByRole('link', { name: '내 부적함' }).getAttribute('href')).toBe('/bujeok/box')
  expect(screen.getByRole('link', { name: '친구에게도 하나 선물하기' }).getAttribute('href')).toBe('/bujeok?mode=gift&style=trad&finish=gold')
  expect(screen.queryByRole('link', { name: '나도 하나 보내기' })).toBeNull()
  expect(loadBox()).toEqual([])
})

test('내 부적 착지: 이름이 없으면 "나의 부적"', () => {
  render(<GiftLanding spec={spec} mine />)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('나의 부적')
})

test('선물 착지에도 내 부적함 버튼이 있다', () => {
  render(<GiftLanding spec={spec} />)
  fireEvent.click(screen.getByRole('button', { name: '그냥 완성하기' }))
  expect(screen.getByRole('link', { name: '내 부적함' }).getAttribute('href')).toBe('/bujeok/box')
})

test('선물 보내기: 공유가 끝났거나 링크를 복사했을 때만 sent로 저장, 취소·실패는 저장 안 함', async () => {
  const go = async (outcome: string) => {
    shareResult.mockResolvedValueOnce(outcome)
    const { unmount } = render(<BujeokClient initial={{ mode: 'gift' }} />)
    pick('연애')
    pick('귀여운')
    type('받는 사람 이름', '민지')
    type('보내는 사람 이름', '철수')
    fireEvent.click(make())
    skipRite()
    await screen.findByTestId('bujeok-card')
    fireEvent.click(screen.getByRole('button', { name: '링크로 보내기' }))
    await waitFor(() => expect(shareResult).toHaveBeenCalled())
    await act(async () => {})
    unmount()
  }
  await go('cancelled')
  await go('failed')
  expect(loadBox()).toEqual([])
  await go('shared_link')
  expect(loadBox()).toMatchObject([{ to: '민지', from: '철수', kind: 'sent' }])
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/민지|철수/)
  localStorage.clear()
  await go('copied')
  expect(loadBox()).toMatchObject([{ to: '민지', kind: 'sent' }])
})

// --- 서버 페이지 ---
const q = (o: Record<string, string>) => Promise.resolve(o)
const props = (code: string, o: Record<string, string> = {}) => ({ params: Promise.resolve({ code }), searchParams: q(o) })
type El = { props: { spec: BujeokSpec; mine?: boolean; to?: unknown; from?: unknown } }

const unwrap = (el: unknown) => (el as { props: { children: El } }).props.children

test('착지 페이지: 쿼리의 to·from은 무시하고, me=1이면 mine', async () => {
  const code = bujeokCode(spec)
  const r = unwrap(await GiftPage(props(code, { to: '민지', from: '철수' })))
  expect(r.props.spec).toEqual(spec)
  expect(r.props.to).toBeUndefined()
  expect(r.props.from).toBeUndefined()
  expect(r.props.mine).toBeFalsy()
  const mine = unwrap(await GiftPage(props(code, { me: '1' })))
  expect(mine.props.mine).toBe(true)
})

test('착지 페이지: 잘못된 코드는 /bujeok 으로 redirect', async () => {
  for (const c of ['trad-money-metal-9-gold', 'trad-money-metal-0', 'oil-money-metal-0-gold', 'x', 'trad-pass-wood-0-gold-zzz', 'cute-pass-wood-0-gold-s' + '0'.repeat(24)]) {
    await expect(GiftPage(props(c, { to: '민지' }))).rejects.toThrow('REDIRECT:/bujeok')
  }
})

test('착지 페이지: 옛 5칸 코드는 그대로 열리고 6칸(획) 코드는 획을 달고 열린다', async () => {
  const old = unwrap(await GiftPage(props('trad-pass-wood-0-gold', {})))
  expect(old.props.spec.stroke).toBeUndefined()
  const s6 = 's' + '5a'.repeat(12)
  const r = unwrap(await GiftPage(props(`trad-pass-wood-0-gold-${s6}`, {})))
  expect(r.props.spec.stroke).toBe(s6)
})

test('착지 metadata: noindex, canonical /bujeok, 어떤 입력에도 메타 전체에 이름이 없다', async () => {
  const code = bujeokCode(spec)
  for (const o of [{ to: '민지', from: '철수' }, { to: '<script>alert(1)</script>' }, { me: '1', to: '민지', from: '철수' }, { to: '가나다라마바사아자' }]) {
    const m = await generateMetadata(props(code, o))
    expect(m.robots).toEqual({ index: false, follow: true })
    expect(m.alternates?.canonical).toBe('https://unse-ai.com/bujeok')
    const all = JSON.stringify(m)
    expect(all).not.toMatch(/민지|철수|<script|alert|가나다라|%EB%AF%BC/)
    const img = (m.openGraph?.images as { url: string }[])[0].url
    expect(img).toContain('kind=bujeok')
    expect(img).not.toMatch(/to=|from=/)
  }
  expect(String((await generateMetadata(props(code, { to: '민지' }))).title)).toContain('부적이 도착했어요')
  expect(String((await generateMetadata(props(code, { me: '1' }))).title)).toContain('나의 부적')
  expect(JSON.stringify((await generateMetadata(props(code, { me: '1' }))).openGraph)).toContain('나의 부적')
})

// --- /bujeok 쿼리 ---
test('/bujeok 페이지는 mode·wish·style·finish를 허용 목록으로 걸러 Initial로 넘긴다', async () => {
  const el = (await BujeokPage({ searchParams: q({ mode: 'gift', wish: 'love', style: 'cute', finish: 'holo' }) })) as unknown as { props: { children?: unknown } }
  const found = JSON.stringify(el, (_k, v) => (typeof v === 'function' ? undefined : v))
  expect(found).toContain('"finish":"holo"')
  const bad = (await BujeokPage({ searchParams: q({ finish: 'red', style: 'oil', wish: 'zzz', mode: 'x' }) })) as unknown
  const s = JSON.stringify(bad, (_k, v) => (typeof v === 'function' ? undefined : v))
  expect(s).not.toMatch(/"finish":"red"|"style":"oil"|"wish":"zzz"/)
})

test('act 정리', async () => {
  await act(async () => {})
})

test('착지(받는 쪽): 닫힌 화면에 도장 찍기가 있고(열어 보기 버튼 없음), 키보드로 찍으면 카드가 열린다. 카드에는 도장이 있다', () => {
  vi.useFakeTimers()
  const stroke = 's' + '5a'.repeat(12)
  render(<GiftLanding spec={{ ...spec, stroke }} />)
  expect(screen.queryByRole('button', { name: '열어 보기' })).toBeNull()
  expect(screen.getByText('보낸 사람이 그은 부적이에요. 도장을 찍어 완성해 주세요')).toBeTruthy()
  expect(screen.queryByTestId('bujeok-card')).toBeNull()
  fireEvent.keyDown(screen.getByRole('button', { name: '도장 찍기' }), { key: 'Enter' })
  act(() => void vi.advanceTimersByTime(800))
  vi.useRealTimers()
  expect(screen.getByTestId('bujeok-card')).toBeTruthy()
  expect(document.querySelector('[data-bujeok-art] svg [data-part=seal]')).not.toBeNull()
})

test('착지(받는 쪽): 도장을 찍으면 그날이 부적함 received 항목의 madeAt과 카드 뒷면 "새김"이 된다. 내 부적 링크는 부적함의 날짜를 읽는다', async () => {
  const { kstDate } = await import('@/lib/kst')
  const { addToBox } = await import('@/lib/bujeok/box')
  vi.useFakeTimers()
  setHash(H('민지', '철수'))
  const { unmount } = render(<GiftLanding spec={spec} />)
  fireEvent.keyDown(screen.getByRole('button', { name: '도장 찍기' }), { key: 'Enter' })
  act(() => void vi.advanceTimersByTime(800))
  vi.useRealTimers()
  expect(loadBox()![0]).toMatchObject({ kind: 'received', madeAt: kstDate(new Date()) })
  expect(screen.getByTestId('bujeok-made-at').textContent).toContain('새김')
  unmount()
  cleanup()
  // 링크로 연 내 부적: 이 기기 부적함에 날짜가 있으면 보이고, 없으면 줄이 없다
  setHash(H('민지'))
  addToBox({ code: bujeokCode(spec), to: '민지', from: null, kind: 'mine', madeAt: '2026-11-11' })
  render(<GiftLanding spec={spec} mine />)
  await waitFor(() => expect(screen.getByTestId('bujeok-made-at').textContent).toBe('2026년 11월 11일 새김'))
  cleanup()
  setHash(H('철수'))
  render(<GiftLanding spec={spec} mine />)
  expect(screen.queryByTestId('bujeok-made-at')).toBeNull()
})

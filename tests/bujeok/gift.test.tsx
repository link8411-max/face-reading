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
import BujeokPage from '@/app/bujeok/page'
import GiftPage, { generateMetadata } from '@/app/bujeok/r/[code]/page'
import { kakaoFeed } from '@/lib/kakao'
import { bujeokCode, bujeokGiftUrl, parseBujeokCode } from '@/lib/bujeok/link'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'money', el: 'metal', variant: 1, finish: 'gold' }

beforeEach(() => {
  track.mockClear()
  shareResult.mockClear()
  window.location.hash = ''
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})
afterEach(cleanup)

const make = () => screen.getByRole('button', { name: '부적 만들기' }) as HTMLButtonElement
const pick = (name: string) => fireEvent.click(screen.getByRole('radio', { name }))
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
  expect(screen.getByLabelText('년도')).toBeTruthy()
  fireEvent.click(screen.getByRole('radio', { name: '선물 보내기' }))
  expect(screen.queryByLabelText('년도')).toBeNull()
  expect(screen.getByLabelText('받는 사람 이름')).toBeTruthy()
})

test('initial.finish가 마감을 미리 고른다', () => {
  render(<BujeokClient initial={{ finish: 'holo' }} />)
  expect(screen.getByRole('radio', { name: '홀로그램' }).getAttribute('aria-checked')).toBe('true')
})

test('선물 완성 화면: 카드(받는 사람 이름 뒷면)와 "선물 보내기"가 있고, 공유 링크는 bujeokGiftUrl과 같다', async () => {
  render(<BujeokClient initial={{ mode: 'gift' }} />)
  pick('연애')
  pick('귀여운')
  pick('종이')
  type('받는 사람 이름', '민지')
  type('보내는 사람 이름', '철수')
  fireEvent.click(make())
  await screen.findByTestId('bujeok-card')
  expect(screen.queryByRole('button', { name: '공유하기' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '선물 보내기' }))
  await waitFor(() => expect(shareResult).toHaveBeenCalledTimes(1))
  const arg = shareResult.mock.calls[0][0] as { url: string; text: string }
  const code = new URL(arg.url).pathname.split('/').pop()!
  const got = parseBujeokCode(code)!
  expect(got).toMatchObject({ style: 'cute', wish: 'love', finish: 'paper' })
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
  fireEvent.click(screen.getByRole('button', { name: '열어 보기' }))
  expect(screen.getByTestId('bujeok-card')).toBeTruthy()
  expect(screen.queryByRole('button', { name: '열어 보기' })).toBeNull()
  expect(screen.getByText('철수님이 보냈어요')).toBeTruthy()
  expect(screen.getByRole('button', { name: '잠금화면용 저장' })).toBeTruthy()
  expect(screen.getByRole('link', { name: '나도 보내기' }).getAttribute('href')).toBe('/bujeok?mode=gift&style=trad&finish=gold')
  expect(screen.getByRole('link', { name: '내 부적 만들기' }).getAttribute('href')).toBe('/bujeok?wish=money&style=trad&finish=gold')
})

test('착지: 이름이 없으면 "부적이 도착했어요", 보낸 사람 줄도 없다', () => {
  render(<GiftLanding spec={spec} />)
  expect(screen.getByText('부적이 도착했어요')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '열어 보기' }))
  expect(screen.queryByText(/님이 보냈어요/)).toBeNull()
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

// --- 서버 페이지 ---
const q = (o: Record<string, string>) => Promise.resolve(o)
const props = (code: string, o: Record<string, string> = {}) => ({ params: Promise.resolve({ code }), searchParams: q(o) })
type El = { props: { spec: BujeokSpec; mine?: boolean; to?: unknown; from?: unknown } }

test('착지 페이지: 쿼리의 to·from은 무시하고, me=1이면 mine', async () => {
  const code = bujeokCode(spec)
  const r = (await GiftPage(props(code, { to: '민지', from: '철수' }))) as unknown as El
  expect(r.props.spec).toEqual(spec)
  expect(r.props.to).toBeUndefined()
  expect(r.props.from).toBeUndefined()
  expect(r.props.mine).toBeFalsy()
  const mine = (await GiftPage(props(code, { me: '1' }))) as unknown as El
  expect(mine.props.mine).toBe(true)
})

test('착지 페이지: 잘못된 코드는 /bujeok 으로 redirect', async () => {
  for (const c of ['trad-money-metal-9-gold', 'trad-money-metal-0', 'oil-money-metal-0-gold', 'x']) {
    await expect(GiftPage(props(c, { to: '민지' }))).rejects.toThrow('REDIRECT:/bujeok')
  }
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

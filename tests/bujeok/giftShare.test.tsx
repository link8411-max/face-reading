// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))
const renderGiftImage = vi.fn<(...a: unknown[]) => Promise<Blob>>()
vi.mock('@/lib/bujeok/giftImage', async (orig) => ({ ...(await orig<typeof import('@/lib/bujeok/giftImage')>()), renderGiftImage: (...a: unknown[]) => renderGiftImage(...a) }))
const saveImage = vi.fn()
vi.mock('@/lib/saveImage', () => ({ saveImage: (...a: unknown[]) => saveImage(...a) }))

import BujeokDone from '@/components/bujeok/BujeokDone'
import { installStorage, restoreStorage } from '../exam/storageStub'
import { bujeokGiftUrl, bujeokOgUrl } from '@/lib/bujeok/link'
import type { BujeokSpec } from '@/lib/bujeok/keys'

const spec: BujeokSpec = { style: 'trad', wish: 'pass', el: 'metal', variant: 1, finish: 'gold' }
const svg = () => document.createElementNS('http://www.w3.org/2000/svg', 'svg')
const KAKAO_UA = 'Mozilla/5.0 (Linux; Android 14; wv) Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.9.0'
const PLAIN_UA = 'Mozilla/5.0 (Linux; Android 14) Chrome/129.0 Mobile Safari/537.36'
const setUA = (ua: string) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })

const nav = navigator as unknown as { share?: unknown; canShare?: unknown }
beforeEach(() => {
  installStorage()
  track.mockClear()
  saveImage.mockClear()
  renderGiftImage.mockReset()
  renderGiftImage.mockResolvedValue(new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }))
  setUA(PLAIN_UA)
  delete (window as { Kakao?: unknown }).Kakao
  delete nav.share
  delete nav.canShare
})
afterEach(() => {
  cleanup()
  restoreStorage()
  vi.useRealTimers()
})

const mount = () => render(<BujeokDone spec={spec} getSvg={svg} onRetry={() => {}} gift={{ to: '민지', from: '철수' }} />)
const kakaoBtn = () => screen.getByRole('button', { name: '카카오톡으로 보내기' })
const linkBtn = () => screen.getByRole('button', { name: '링크로 보내기' })
const saveBtn = () => screen.getByRole('button', { name: '그림 저장' })
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const GIFT_URL = bujeokGiftUrl(spec, { to: '민지', from: '철수' })

function kakaoStub(uploadImage: (a: { file: File[] }) => Promise<unknown>) {
  const sendDefault = vi.fn()
  ;(window as unknown as { Kakao: unknown }).Kakao = { isInitialized: () => true, init() {}, Share: { sendDefault, uploadImage } }
  return sendDefault
}
type Feed = { objectType: string; content: { imageUrl: string; imageWidth: number; imageHeight: number; title: string; description: string; link: { webUrl: string; mobileWebUrl: string } }; buttons: { title: string; link: { webUrl: string; mobileWebUrl: string } }[] }
const feedOf = (sendDefault: ReturnType<typeof vi.fn>) => (sendDefault.mock.calls[0] as unknown as [Feed])[0]
const upOk = () => vi.fn<(a: { file: File[] }) => Promise<unknown>>(async () => ({ infos: { original: { url: 'https://img1.kakaocdn.net/x/original.png', width: 1080, height: 1350 } } }))

test('완성 화면이 뜨면 그림을 미리 만든다(누르기 전에)', async () => {
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalledTimes(1), { timeout: 3000 })
  expect(renderGiftImage.mock.calls[0].slice(1)).toEqual(['trad', 'gold', 'pass', '민지'])
})

test('선물 완성 화면 버튼 순서: 카카오톡으로 보내기 → 링크로 보내기 → 그림 저장 (옛 "선물 보내기"는 없다)', () => {
  mount()
  const names = screen.getAllByRole('button').map((b) => b.textContent?.trim())
  expect(names.slice(0, 3)).toEqual(['카카오톡으로 보내기', '링크로 보내기', '그림 저장'])
  expect(screen.queryByRole('button', { name: '선물 보내기' })).toBeNull()
  expect(screen.queryByRole('button', { name: '잠금화면용 저장' })).toBeNull()
})

test('카카오톡이 아닌 브라우저에서도 Kakao SDK sendDefault로 카드를 보낸다(업로드한 그림, 제목·설명·버튼·링크)', async () => {
  setUA(PLAIN_UA)
  const upload = upOk()
  const sendDefault = kakaoStub(upload)
  const share = vi.fn(async () => {})
  nav.share = share
  mount()
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(1), { timeout: 3000 }) // 탭 전에 업로드 시작
  expect(upload.mock.calls[0][0].file[0].type).toBe('image/png')
  expect(sendDefault).not.toHaveBeenCalled()
  fireEvent.click(kakaoBtn())
  await waitFor(() => expect(sendDefault).toHaveBeenCalledTimes(1))
  const f = feedOf(sendDefault)
  expect(f.objectType).toBe('feed')
  expect(f.content.imageUrl).toBe('https://img1.kakaocdn.net/x/original.png')
  expect(f.content.imageWidth).toBe(1080)
  expect(f.content.imageHeight).toBe(1350)
  expect(f.content.title).toBe('민지님께 합격 부적이 도착했어요')
  expect(f.content.description).toBe('열어서 손으로 돌려 보세요')
  expect(f.content.link).toEqual({ webUrl: GIFT_URL, mobileWebUrl: GIFT_URL })
  expect(f.buttons).toEqual([{ title: '부적 열어 보기', link: { webUrl: GIFT_URL, mobileWebUrl: GIFT_URL } }])
  expect(share).not.toHaveBeenCalled() // 기기 공유창은 열지 않는다
})

test('카카오톡 인앱에서도 같은 카드', async () => {
  setUA(KAKAO_UA)
  const sendDefault = kakaoStub(upOk())
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  fireEvent.click(kakaoBtn())
  await waitFor(() => expect(sendDefault).toHaveBeenCalledTimes(1))
  expect(feedOf(sendDefault).buttons[0].title).toBe('부적 열어 보기')
})

test('카카오: 업로드가 실패하면 기존 미리보기 이미지(1200×630, 이름 없음)', async () => {
  const upload = vi.fn(async () => { throw new Error('upload failed') })
  const sendDefault = kakaoStub(upload)
  mount()
  await waitFor(() => expect(upload).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  fireEvent.click(kakaoBtn())
  await waitFor(() => expect(sendDefault).toHaveBeenCalledTimes(1))
  const c = feedOf(sendDefault).content
  expect(c.imageUrl).toBe(bujeokOgUrl(spec))
  expect(c.imageUrl).not.toContain('민지')
  expect(c.imageWidth).toBe(1200)
  expect(c.imageHeight).toBe(630)
})

test('카카오: 업로드가 3초 넘게 걸리면 기다리지 않고 기존 미리보기 이미지', async () => {
  const upload = vi.fn(() => new Promise(() => {}))
  const sendDefault = kakaoStub(upload)
  mount()
  await waitFor(() => expect(upload).toHaveBeenCalled(), { timeout: 3000 })
  vi.useFakeTimers()
  fireEvent.click(kakaoBtn())
  await vi.advanceTimersByTimeAsync(2900)
  expect(sendDefault).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(200)
  expect(sendDefault).toHaveBeenCalledTimes(1)
  expect(feedOf(sendDefault).content.imageUrl).toBe(bujeokOgUrl(spec))
})

test('카카오 SDK를 못 쓰면 링크 공유로 떨어지고 짧은 안내가 나온다', async () => {
  const share = vi.fn(async () => {})
  nav.share = share
  nav.canShare = vi.fn(() => true)
  ;(window as unknown as { Kakao: unknown }).Kakao = { isInitialized: () => { throw new Error('no sdk') }, init() {}, Share: {} }
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  fireEvent.click(kakaoBtn())
  await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
  const arg = (share.mock.calls[0] as unknown as [ShareData])[0]
  expect(arg.files).toBeUndefined()
  expect(arg.url).toBe(GIFT_URL)
  expect((await screen.findByRole('status')).textContent).toMatch(/카카오톡/)
})

test('링크로 보내기: navigator.share에 title·text·url만(files 없음 — canShare가 참이어도)', async () => {
  const share = vi.fn(async () => {})
  nav.share = share
  nav.canShare = vi.fn(() => true)
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle() // 그림이 준비된 뒤에도 파일은 싣지 않는다
  fireEvent.click(linkBtn())
  await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
  const arg = (share.mock.calls[0] as unknown as [ShareData])[0]
  expect('files' in arg).toBe(false)
  expect(arg.url).toBe(GIFT_URL)
  expect(arg.title).toBeTruthy()
  expect(arg.text).toContain('민지님께')
})

test('링크로 보내기: 공유창이 없으면 링크를 복사하고 안내', async () => {
  const writeText = vi.fn(async () => {})
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  mount()
  fireEvent.click(linkBtn())
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
  expect((writeText.mock.calls[0] as unknown as [string])[0]).toContain(GIFT_URL)
  expect((await screen.findByRole('status')).textContent).toContain('복사')
})

test('그림 저장: 만들어 둔 선물 PNG를 saveImage로 저장한다', async () => {
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  fireEvent.click(saveBtn())
  await waitFor(() => expect(saveImage).toHaveBeenCalledTimes(1))
  const [blob, name] = saveImage.mock.calls[0] as [Blob, string]
  expect(blob.type).toBe('image/png')
  expect(name).toBe('bujeok.png')
})

test('GA: 카카오 kakao · 링크 link · 저장 save_image, 이름은 안 간다', async () => {
  nav.share = vi.fn(async () => {})
  kakaoStub(upOk())
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  fireEvent.click(kakaoBtn())
  await waitFor(() => expect(track).toHaveBeenCalledWith('share_click', { test_name: 'bujeok', method: 'kakao' }))
  fireEvent.click(linkBtn())
  await waitFor(() => expect(track).toHaveBeenCalledWith('share_click', { test_name: 'bujeok', method: 'link' }))
  fireEvent.click(saveBtn())
  await waitFor(() => expect(track).toHaveBeenCalledWith('share_click', { test_name: 'bujeok', method: 'save_image' }))
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/민지|철수/)
})

test('내 부적(선물이 아님) 모드는 선물 그림을 만들지 않고 기존 버튼을 쓴다', async () => {
  render(<BujeokDone spec={spec} getSvg={svg} onRetry={() => {}} />)
  await settle()
  expect(renderGiftImage).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: '공유하기' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: '카카오톡으로 보내기' })).toBeNull()
})

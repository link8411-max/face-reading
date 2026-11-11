// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const track = vi.fn()
vi.mock('@/lib/analytics', () => ({ track: (...a: unknown[]) => track(...a) }))
const renderGiftImage = vi.fn<(...a: unknown[]) => Promise<Blob>>()
vi.mock('@/lib/bujeok/giftImage', async (orig) => ({ ...(await orig<typeof import('@/lib/bujeok/giftImage')>()), renderGiftImage: (...a: unknown[]) => renderGiftImage(...a) }))

import BujeokDone from '@/components/bujeok/BujeokDone'
import { installStorage, restoreStorage } from '../exam/storageStub'
import { bujeokOgUrl } from '@/lib/bujeok/link'
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
const send = () => fireEvent.click(screen.getByRole('button', { name: '선물 보내기' }))
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })

test('완성 화면이 뜨면 그림을 미리 만든다(누르기 전에)', async () => {
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalledTimes(1), { timeout: 3000 })
  expect(renderGiftImage.mock.calls[0].slice(1)).toEqual(['trad', 'gold'])
})

test('기본 공유창: canShare가 참이면 PNG File을 navigator.share에 넘긴다(주소는 문구에 붙는다)', async () => {
  const share = vi.fn(async () => {})
  nav.share = share
  nav.canShare = vi.fn(() => true)
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  send()
  await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
  const arg = (share.mock.calls[0] as unknown as [ShareData])[0]
  expect(arg.files).toHaveLength(1)
  expect(arg.files![0]).toBeInstanceOf(File)
  expect(arg.files![0].type).toBe('image/png')
  expect(arg.files![0].name).toBe('bujeok.png')
  expect(arg.text).toContain('민지')
  expect(arg.text).toContain('/bujeok/r/')
  expect(arg.text).toContain('#to=')
})

test('canShare가 거짓이면 파일 없이 링크 공유로 떨어진다', async () => {
  const share = vi.fn(async () => {})
  nav.share = share
  nav.canShare = vi.fn(() => false)
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  send()
  await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
  const arg = (share.mock.calls[0] as unknown as [ShareData])[0]
  expect(arg.files).toBeUndefined()
  expect(arg.url).toContain('/bujeok/r/')
})

test('그림 만들기가 실패했거나 아직이면 기다리지 않고 링크 공유(누르자마자 공유창)', async () => {
  const share = vi.fn(async () => {})
  nav.share = share
  nav.canShare = vi.fn(() => true)
  renderGiftImage.mockReturnValue(new Promise(() => {})) // 끝나지 않음
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  send()
  await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
  expect((share.mock.calls[0] as unknown as [ShareData])[0].files).toBeUndefined()
})

test('이름은 GA에 들어가지 않는다', async () => {
  nav.share = vi.fn(async () => {})
  nav.canShare = vi.fn(() => true)
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  send()
  await settle()
  expect(JSON.stringify(track.mock.calls)).not.toMatch(/민지|철수/)
})

// --- 카카오톡 인앱 ---
function kakaoStub(uploadImage: (a: { file: File[] }) => Promise<unknown>) {
  const sendDefault = vi.fn()
  ;(window as unknown as { Kakao: unknown }).Kakao = { isInitialized: () => true, init() {}, Share: { sendDefault, uploadImage } }
  return sendDefault
}
const feedOf = (sendDefault: ReturnType<typeof vi.fn>) => (sendDefault.mock.calls[0] as unknown as [{ content: { imageUrl: string; imageWidth: number; imageHeight: number; title: string } }])[0].content

test('카카오톡: 완성 화면이 뜨면 업로드를 먼저 시작하고, 누르면 올라간 그림 주소로 카드를 보낸다', async () => {
  setUA(KAKAO_UA)
  const upload = vi.fn<(a: { file: File[] }) => Promise<unknown>>(async () => ({ infos: { original: { url: 'https://img1.kakaocdn.net/x/original.png', width: 1080, height: 1350 } } }))
  const sendDefault = kakaoStub(upload)
  mount()
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(1), { timeout: 3000 }) // 탭 전에 시작
  expect(upload.mock.calls[0][0].file[0].type).toBe('image/png')
  expect(sendDefault).not.toHaveBeenCalled()
  send()
  await waitFor(() => expect(sendDefault).toHaveBeenCalledTimes(1))
  const c = feedOf(sendDefault)
  expect(c.imageUrl).toBe('https://img1.kakaocdn.net/x/original.png')
  expect(c.imageWidth).toBe(1080)
  expect(c.imageHeight).toBe(1350)
  expect(c.title).toContain('민지') // 카드 제목은 보내는 쪽 화면에서만 이름을 넣는다(기존 규칙)
})

test('카카오톡: 업로드가 실패하면 기존 미리보기 이미지(1200×630, 이름 없음)로 보낸다', async () => {
  setUA(KAKAO_UA)
  const upload = vi.fn(async () => { throw new Error('upload failed') })
  const sendDefault = kakaoStub(upload)
  mount()
  await waitFor(() => expect(upload).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  send()
  await waitFor(() => expect(sendDefault).toHaveBeenCalledTimes(1))
  const c = feedOf(sendDefault)
  expect(c.imageUrl).toBe(bujeokOgUrl(spec))
  expect(c.imageUrl).not.toContain('민지')
  expect(c.imageWidth).toBe(1200)
  expect(c.imageHeight).toBe(630)
})

test('카카오톡: 업로드가 3초 넘게 걸리면 기다리지 않고 기존 미리보기 이미지로 보낸다', async () => {
  setUA(KAKAO_UA)
  const upload = vi.fn(() => new Promise(() => {}))
  const sendDefault = kakaoStub(upload)
  mount()
  await waitFor(() => expect(upload).toHaveBeenCalled(), { timeout: 3000 }) // 올리는 중(끝나지 않음)
  vi.useFakeTimers()
  send()
  await vi.advanceTimersByTimeAsync(2900)
  expect(sendDefault).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(200)
  expect(sendDefault).toHaveBeenCalledTimes(1)
  expect(feedOf(sendDefault).imageUrl).toBe(bujeokOgUrl(spec))
})

test('카카오톡이 아니면 업로드를 하지 않는다', async () => {
  const upload = vi.fn(async () => ({}))
  kakaoStub(upload)
  mount()
  await waitFor(() => expect(renderGiftImage).toHaveBeenCalled(), { timeout: 3000 })
  await settle()
  expect(upload).not.toHaveBeenCalled()
})

test('내 부적(선물이 아님) 모드는 선물 그림을 만들지 않는다', async () => {
  render(<BujeokDone spec={spec} getSvg={svg} onRetry={() => {}} />)
  await settle()
  expect(renderGiftImage).not.toHaveBeenCalled()
})

import { expect, test, vi, afterEach } from 'vitest'
import { GIFT_IMAGE, giftImageLayout } from '@/lib/bujeok/giftImage'
import { pickKakaoImage, KAKAO_UPLOAD_TIMEOUT_MS, type KakaoImage } from '@/lib/bujeok/giftShare'
import { kakaoFeed, uploadKakaoImage } from '@/lib/kakao'

afterEach(() => {
  vi.useRealTimers()
  delete (globalThis as { window?: unknown }).window
})

test('선물 이미지는 1080×1350 세로, 카드는 그림 비율(300:520)로 가운데에 놓이고 워터마크 자리가 남는다', () => {
  expect(GIFT_IMAGE).toEqual({ w: 1080, h: 1350 })
  const l = giftImageLayout()
  expect(l.h / l.w).toBeCloseTo(520 / 300, 2)
  expect(l.x * 2 + l.w).toBeCloseTo(GIFT_IMAGE.w, 0)
  expect(l.y).toBeGreaterThanOrEqual(60)
  expect(GIFT_IMAGE.h - (l.y + l.h)).toBeGreaterThanOrEqual(120) // 워터마크 자리
  expect(l.x).toBeGreaterThan(100) // 채팅 미리보기에서 잘려도 카드가 남는 여백
})

const OG: KakaoImage = { url: 'https://unse-ai.com/api/og/result?kind=bujeok&style=trad&wish=pass&finish=gold', width: 1200, height: 630 }
const UP: KakaoImage = { url: 'https://img1.kakaocdn.net/abc/original.png', width: 1080, height: 1350 }

test('카카오 이미지 고르기: 올라간 그림이 있으면 그 주소', async () => {
  expect(await pickKakaoImage(Promise.resolve(UP), OG)).toEqual(UP)
})

test('카카오 이미지 고르기: 업로드가 실패하면 기존 미리보기 이미지', async () => {
  expect(await pickKakaoImage(Promise.reject(new Error('x')), OG)).toEqual(OG)
  expect(await pickKakaoImage(Promise.resolve(null), OG)).toEqual(OG)
  expect(await pickKakaoImage(null, OG)).toEqual(OG)
})

test('카카오 이미지 고르기: 3초 안에 안 끝나면 기존 미리보기 이미지', async () => {
  vi.useFakeTimers()
  expect(KAKAO_UPLOAD_TIMEOUT_MS).toBe(3000)
  const never = new Promise<KakaoImage>(() => {})
  const p = pickKakaoImage(never, OG)
  await vi.advanceTimersByTimeAsync(2999)
  let done = false
  void p.then(() => { done = true })
  await vi.advanceTimersByTimeAsync(0)
  expect(done).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  expect(await p).toEqual(OG)
})

test('kakaoFeed: 올라간 그림이면 그 크기로 카드를 만든다(기본은 1200×630)', () => {
  const m = { title: 't', text: 'x', url: 'https://unse-ai.com/bujeok/r/a#to=b', imageUrl: OG.url }
  expect(kakaoFeed(m).content).toMatchObject({ imageUrl: OG.url, imageWidth: 1200, imageHeight: 630 })
  expect(kakaoFeed({ ...m, imageUrl: UP.url, imageSize: { width: 1080, height: 1350 } }).content).toMatchObject({ imageUrl: UP.url, imageWidth: 1080, imageHeight: 1350 })
})

const file = () => new File([new Uint8Array([1])], 'bujeok.png', { type: 'image/png' })
const withKakao = (uploadImage: (a: { file: File[] }) => Promise<unknown>) => {
  ;(globalThis as { window?: unknown }).window = { Kakao: { isInitialized: () => true, init() {}, Share: { sendDefault() {}, uploadImage } } }
}

test('uploadKakaoImage: Kakao.Share.uploadImage({ file: [File] })의 infos.original.url을 돌려준다', async () => {
  const up = vi.fn(async () => ({ infos: { original: { url: UP.url, width: 1080, height: 1350 } } }))
  withKakao(up)
  const f = file()
  expect(await uploadKakaoImage(f)).toEqual(UP)
  expect(up).toHaveBeenCalledWith({ file: [f] })
})

test('uploadKakaoImage: 응답에 크기가 없으면 1080×1350, 실패·이상한 응답은 null', async () => {
  withKakao(async () => ({ infos: { original: { url: UP.url } } }))
  expect(await uploadKakaoImage(file())).toEqual(UP)
  withKakao(async () => { throw new Error('boom') })
  expect(await uploadKakaoImage(file())).toBeNull()
  withKakao(async () => ({ infos: {} }))
  expect(await uploadKakaoImage(file())).toBeNull()
  withKakao(async () => ({ infos: { original: { url: 'http://evil.example/x.png' } } }))
  expect(await uploadKakaoImage(file())).toBeNull() // https 아닌 주소는 쓰지 않는다
})

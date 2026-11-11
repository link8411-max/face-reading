import { writeFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

const SHOT_DIR = process.env.BUJEOK_SHOT_DIR
const TO = '민지'

async function toGiftDone(page: Page) {
  await page.goto('/bujeok?mode=gift')
  await page.getByRole('radio', { name: '합격' }).click()
  await page.getByRole('radio', { name: '전통' }).click()
  await page.getByLabel('받는 사람 이름').fill(TO)
  await page.getByRole('button', { name: '부적 만들기' }).click()
  await expect(page.getByTestId('bujeok-card')).toBeVisible()
  await expect(page.getByRole('button', { name: '선물 보내기' })).toBeVisible()
  await page.waitForTimeout(2500) // 완성 화면에서 그림을 미리 만들어 두는 시간
}

type Shared = { files?: { name: string; type: string; size: number; b64: string }[]; text?: string; url?: string; title?: string }
const readShared = (page: Page) => page.evaluate(() => (window as unknown as { __shared?: Shared }).__shared ?? null)

const pngDims = (b64: string) => {
  const b = Buffer.from(b64, 'base64')
  expect(b.subarray(1, 4).toString()).toBe('PNG')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

test('선물 보내기: canShare가 참이면 이름 도장이 찍힌 1080×1350 PNG File이 navigator.share로 간다', async ({ page }) => {
  await page.addInitScript(() => {
    const nav = navigator as unknown as { share: (d: ShareData) => Promise<void>; canShare: (d: ShareData) => boolean }
    nav.canShare = (d) => !!d.files && d.files.every((f) => f.type === 'image/png')
    nav.share = async (d) => {
      const files = await Promise.all((d.files ?? []).map(async (f) => {
        const buf = new Uint8Array(await f.arrayBuffer())
        let s = ''
        for (const x of buf) s += String.fromCharCode(x)
        return { name: f.name, type: f.type, size: f.size, b64: btoa(s) }
      }))
      ;(window as unknown as { __shared: unknown }).__shared = { files, text: d.text, url: d.url, title: d.title }
    }
  })
  await toGiftDone(page)
  await page.getByRole('button', { name: '선물 보내기' }).click()
  await expect.poll(() => readShared(page)).not.toBeNull()
  const sh = (await readShared(page))!
  expect(sh.files).toHaveLength(1)
  expect(sh.files![0].type).toBe('image/png')
  expect(sh.files![0].name).toBe('bujeok.png')
  expect(sh.files![0].size).toBeGreaterThan(5000)
  expect(pngDims(sh.files![0].b64)).toEqual({ w: 1080, h: 1350 })
  expect(sh.text).toContain(TO)
  expect(sh.text).toMatch(/\/bujeok\/r\/[a-z0-9-]+\?[^ ]*#to=/)
  if (SHOT_DIR) writeFileSync(`${SHOT_DIR}/gift-image.png`, Buffer.from(sh.files![0].b64, 'base64'))
})

test('선물 보내기: canShare가 거짓이면 파일 없이 링크 공유', async ({ page }) => {
  await page.addInitScript(() => {
    const nav = navigator as unknown as { share: (d: ShareData) => Promise<void>; canShare: (d: ShareData) => boolean }
    nav.canShare = () => false
    nav.share = async (d) => {
      ;(window as unknown as { __shared: unknown }).__shared = { files: d.files ? [{}] : undefined, text: d.text, url: d.url }
    }
  })
  await toGiftDone(page)
  await page.getByRole('button', { name: '선물 보내기' }).click()
  await expect.poll(() => readShared(page)).not.toBeNull()
  const sh = (await readShared(page))!
  expect(sh.files).toBeUndefined()
  expect(sh.url).toMatch(/\/bujeok\/r\//)
})

test.describe('카카오톡 인앱', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.9.0' })

  const stub = (mode: 'ok' | 'fail') => async (page: Page) => {
    await page.addInitScript((m) => {
      const w = window as unknown as { __up: unknown[]; __feed: unknown; Kakao: unknown }
      w.__up = []
      w.Kakao = {
        isInitialized: () => true,
        init() {},
        Share: {
          uploadImage: async ({ file }: { file: File[] }) => {
            w.__up.push({ type: file[0].type, size: file[0].size })
            if (m === 'fail') throw new Error('x')
            return { infos: { original: { url: 'https://img1.kakaocdn.net/test/original.png', width: 1080, height: 1350 } } }
          },
          sendDefault: (t: unknown) => { w.__feed = t },
        },
      }
    }, mode)
  }
  const state = (page: Page) => page.evaluate(() => { const w = window as unknown as { __up: { type: string; size: number }[]; __feed?: { content: { imageUrl: string; imageWidth: number; imageHeight: number } } }; return { up: w.__up, feed: w.__feed ?? null } })

  test('완성 화면에서 PNG를 먼저 올려 두고, 보내기를 누르면 올라간 주소가 카드 이미지가 된다', async ({ page }) => {
    await stub('ok')(page)
    await toGiftDone(page)
    expect((await state(page)).up).toHaveLength(1) // 누르기 전에 업로드됨
    expect((await state(page)).up[0].type).toBe('image/png')
    expect((await state(page)).feed).toBeNull()
    await page.getByRole('button', { name: '선물 보내기' }).click()
    await expect.poll(async () => (await state(page)).feed).not.toBeNull()
    expect((await state(page)).feed!.content).toMatchObject({ imageUrl: 'https://img1.kakaocdn.net/test/original.png', imageWidth: 1080, imageHeight: 1350 })
  })

  test('업로드가 실패하면 기존 미리보기 이미지(이름 없음)로 보낸다', async ({ page }) => {
    await stub('fail')(page)
    await toGiftDone(page)
    await page.getByRole('button', { name: '선물 보내기' }).click()
    await expect.poll(async () => (await state(page)).feed).not.toBeNull()
    const c = (await state(page)).feed!.content
    expect(c.imageUrl).toContain('/api/og/result?kind=bujeok')
    expect(c.imageUrl).not.toContain(encodeURIComponent(TO))
    expect(c).toMatchObject({ imageWidth: 1200, imageHeight: 630 })
  })
})

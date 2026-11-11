import { readFileSync, writeFileSync } from 'node:fs'
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
  await expect(page.getByRole('button', { name: '링크로 보내기' })).toBeVisible()
  await page.waitForTimeout(2500) // 완성 화면에서 그림을 미리 만들어 두는 시간
}

type Shared = { files?: unknown; text?: string; url?: string; title?: string }
const readShared = (page: Page) => page.evaluate(() => (window as unknown as { __shared?: Shared }).__shared ?? null)

const pngDims = (b: Buffer) => {
  expect(b.subarray(1, 4).toString()).toBe('PNG')
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

type Rec = { up: { type: string; size: number }[]; feeds: { objectType: string; content: { title: string; description: string; imageUrl: string; imageWidth: number; imageHeight: number; link: { webUrl: string } }; buttons: { title: string; link: { webUrl: string } }[] }[] }
const kakaoStub = (mode: 'ok' | 'fail') => async (page: Page) => {
  await page.addInitScript((m) => {
    const w = window as unknown as { __rec: { up: unknown[]; feeds: unknown[] }; Kakao: unknown }
    w.__rec = { up: [], feeds: [] }
    w.Kakao = {
      isInitialized: () => true,
      init() {},
      Share: {
        uploadImage: async ({ file }: { file: File[] }) => {
          w.__rec.up.push({ type: file[0].type, size: file[0].size })
          if (m === 'fail') throw new Error('x')
          return { infos: { original: { url: 'https://img1.kakaocdn.net/test/original.png', width: 1080, height: 1350 } } }
        },
        sendDefault: (t: unknown) => { w.__rec.feeds.push(t) },
      },
    }
  }, mode)
}
const rec = (page: Page) => page.evaluate(() => (window as unknown as { __rec: Rec }).__rec)

const shareStub = async (page: Page) => {
  await page.addInitScript(() => {
    const nav = navigator as unknown as { share: (d: ShareData) => Promise<void>; canShare: (d: ShareData) => boolean }
    nav.canShare = () => true // 파일 공유가 가능한 기기여도 링크 공유에는 파일이 없어야 한다
    nav.share = async (d) => {
      ;(window as unknown as { __shared: unknown }).__shared = { files: d.files, text: d.text, url: d.url, title: d.title }
    }
  })
}

test('선물 완성 화면 버튼 순서: 카카오톡으로 보내기 → 링크로 보내기 → 그림 저장', async ({ page }) => {
  await kakaoStub('ok')(page)
  await toGiftDone(page)
  const names = await page.locator('.no-screenshot:has(button:text-is("카카오톡으로 보내기")) > button, .no-screenshot:has(button:text-is("카카오톡으로 보내기")) > a').allTextContents()
  expect(names.map((t) => t.trim()).slice(0, 5)).toEqual(['카카오톡으로 보내기', '링크로 보내기', '그림 저장', '다시 만들기', '내 부적함'])
  await expect(page.getByRole('button', { name: '선물 보내기' })).toHaveCount(0)
})

test('링크로 보내기: navigator.share에 files 없이 title·text·url(해시 포함)만 간다', async ({ page }) => {
  await kakaoStub('ok')(page)
  await shareStub(page)
  await toGiftDone(page)
  await page.getByRole('button', { name: '링크로 보내기' }).click()
  await expect.poll(() => readShared(page)).not.toBeNull()
  const sh = (await readShared(page))!
  expect(sh.files).toBeUndefined()
  expect(sh.url).toMatch(/\/bujeok\/r\/[a-z0-9-]+\?[^ ]*#to=/)
  expect(sh.text).toContain(TO)
})

test('카카오톡으로 보내기: 카카오톡 인앱이 아닌 브라우저에서도 SDK sendDefault, 올려 둔 그림·제목·버튼·선물 주소', async ({ page }) => {
  await kakaoStub('ok')(page)
  await shareStub(page)
  await toGiftDone(page)
  expect((await rec(page)).up).toHaveLength(1) // 누르기 전에 업로드됨
  expect((await rec(page)).up[0].type).toBe('image/png')
  await page.getByRole('button', { name: '카카오톡으로 보내기' }).click()
  await expect.poll(async () => (await rec(page)).feeds.length).toBe(1)
  const f = (await rec(page)).feeds[0]
  expect(f.content).toMatchObject({ title: `${TO}님께 합격 부적이 도착했어요`, description: '열어서 손으로 돌려 보세요', imageUrl: 'https://img1.kakaocdn.net/test/original.png', imageWidth: 1080, imageHeight: 1350 })
  expect(f.content.link.webUrl).toMatch(/\/bujeok\/r\/[a-z0-9-]+\?[^ ]*#to=/)
  expect(f.buttons).toEqual([{ title: '부적 열어 보기', link: f.content.link }])
  expect(await readShared(page)).toBeNull() // 기기 공유창은 열리지 않는다
})

test('카카오톡으로 보내기: 업로드가 실패하면 이름 없는 미리보기 이미지(1200×630)', async ({ page }) => {
  await kakaoStub('fail')(page)
  await toGiftDone(page)
  await page.getByRole('button', { name: '카카오톡으로 보내기' }).click()
  await expect.poll(async () => (await rec(page)).feeds.length).toBe(1)
  const c = (await rec(page)).feeds[0].content
  expect(c.imageUrl).toContain('/api/og/result?kind=bujeok')
  expect(c.imageUrl).not.toContain(encodeURIComponent(TO))
  expect(c).toMatchObject({ imageWidth: 1200, imageHeight: 630 })
})

test('그림 저장: 이름 도장이 찍힌 1080×1350 PNG를 내려받는다', async ({ page }) => {
  await kakaoStub('ok')(page)
  await toGiftDone(page)
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: '그림 저장' }).click()
  const path = await (await dl).path()
  const buf = readFileSync(path)
  expect(buf.length).toBeGreaterThan(5000)
  expect(pngDims(buf)).toEqual({ w: 1080, h: 1350 })
  if (SHOT_DIR) writeFileSync(`${SHOT_DIR}/gift-image.png`, buf)
})

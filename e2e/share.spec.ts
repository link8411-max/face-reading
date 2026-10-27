import { test, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import { trackErrors } from './helpers'

const FACE = 'public/dev-faces/person1.jpg'

async function faceResult(page: Page) {
  await page.goto('/face2')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('button', { name: '관상 보기' }).click({ timeout: 30000 })
  await expect(page.getByRole('button', { name: '공유하기' })).toBeVisible({ timeout: 30000 })
}

test.describe('관상 결과: 요약 카드 먼저, 공유하기', () => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')

  test('결과 카드에 워터마크, 상세 풀이는 접혀 있다', async ({ page }) => {
    const errors = trackErrors(page)
    await faceResult(page)
    const card = page.locator('article').first()
    await expect(card).toContainText('운명을 읽다')
    await expect(card).toContainText('unse-ai.com')
    await expect(card.getByRole('meter')).toHaveCount(3)
    const details = page.locator('details', { hasText: '풀이 자세히 보기' })
    await expect(details).not.toHaveAttribute('open', '')
    const y = async (l: import('@playwright/test').Locator) => (await l.boundingBox())!.y
    expect(await y(card)).toBeLessThan(await y(page.getByRole('button', { name: '공유하기' })))
    expect(errors).toEqual([])
  })

  test('공유하기: 기본 공유창에 결과 링크와 1인칭 문구를 보낸다 (이름·사진 없음)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared: ShareData[] }
      w.__shared = []
      Object.assign(navigator, { canShare: () => true, share: async (d: ShareData) => { w.__shared.push({ title: d.title, text: d.text, url: d.url, files: d.files }) } })
    })
    await faceResult(page)
    await page.getByRole('button', { name: '공유하기' }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared.length), { timeout: 20000 }).toBe(1)
    const sent = await page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared[0])
    expect(sent.url).toMatch(/^https:\/\/unse-ai\.com\/face2\/r\/[a-z]+\?utm_source=share&utm_medium=friend_link&utm_campaign=face$/)
    expect(sent.text).toMatch(/^나는 .+이래\. 너 관상도 봐줄까\?$/)
    expect(sent.files).toBeUndefined()
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('공유하기: 공유창이 없으면(PC) 링크를 복사하고 안내한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.addInitScript(() => { Object.assign(navigator, { canShare: undefined, share: undefined }) })
    await faceResult(page)
    await page.getByRole('button', { name: '공유하기' }).click()
    await expect(page.getByRole('status')).toContainText('링크를 복사했어요')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/나는 .+ https:\/\/unse-ai\.com\/face2\/r\//)
  })

  test('사용자가 공유를 취소하면 아무 안내도 하지 않는다', async ({ page }) => {
    await page.addInitScript(() => {
      Object.assign(navigator, { canShare: () => true, share: async () => { throw new DOMException('cancel', 'AbortError') } })
    })
    await faceResult(page)
    await page.getByRole('button', { name: '공유하기' }).click()
    await expect(page.getByRole('button', { name: '공유하기' })).toBeEnabled({ timeout: 20000 })
    await expect(page.getByRole('status')).toHaveCount(0)
  })
})

// 리뷰 Critical: 이미지 저장이 카드 자체 배경(남색 게임 카드)을 지우지 않는다
test('삼국지 이미지 저장: 저장 PNG에 남색 카드 배경이 살아 있다', async ({ page }) => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
  await page.addInitScript(() => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Macintosh) Chrome/120' }) })
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('radio', { name: '남자' }).click()
  await page.getByRole('button', { name: '닮은 장수 찾기' }).click()
  await expect(page.getByRole('button', { name: '이미지 저장' })).toBeVisible({ timeout: 30000 })
  const dl = page.waitForEvent('download', { timeout: 20000 })
  await page.getByRole('button', { name: '이미지 저장' }).click()
  const buf = await (await dl).createReadStream().then(async (s) => { const c: Buffer[] = []; for await (const x of s!) c.push(x as Buffer); return Buffer.concat(c) })
  const px = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)
    // 회사생활 STATUS 아래 왼쪽 여백 쯤 (카드 안쪽)
    return Array.from(ctx.getImageData(Math.round(img.width * 0.04), Math.round(img.height * 0.5), 1, 1).data)
  }, buf.toString('base64'))
  expect(px[0] + px[1] + px[2], `pixel ${px}`).toBeLessThan(250) // 남색(#23263A ≈ 35+38+58)
})

// 카카오톡(안드로이드) 인앱: blob 다운로드가 "지원하지 않는 파일 형식"으로 실패하던 문제
test.describe('카카오톡 인앱 브라우저', () => {
  // 서비스 워커가 외부 스크립트를 대신 받으면 차단·가짜 SDK가 적용되지 않으므로 끈다
  test.use({ serviceWorkers: 'block' })
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.9.0' })

  test('이미지 저장: 다운로드 대신 길게 눌러 저장 화면(data 이미지)과 다른 브라우저로 열기', async ({ page }) => {
    test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
    await page.addInitScript(() => { Object.assign(navigator, { canShare: undefined, share: undefined }) })
    const downloads: string[] = []
    page.on('download', (d) => downloads.push(d.suggestedFilename()))
    await faceResult(page)
    for (const btn of ['이미지 저장']) {
      await page.getByRole('button', { name: btn }).click()
      const dialog = page.getByRole('dialog', { name: '이미지 저장' })
      await expect(dialog).toBeVisible({ timeout: 20000 })
      await expect(dialog.getByRole('img')).toHaveAttribute('src', /^data:image\/png;base64,/)
      await expect(dialog.getByRole('button', { name: '다른 브라우저로 열기' })).toBeVisible()
      await dialog.getByRole('button', { name: '닫기' }).click()
      await expect(dialog).toHaveCount(0)
    }
    expect(downloads).toEqual([])
  })

  test('공유하기: 카카오톡 공유 화면으로 결과 링크·1인칭 문구·미리보기 이미지를 보낸다', async ({ page }) => {
    test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
    await page.addInitScript(() => {
      const w = window as unknown as { __kakao: unknown[]; Kakao: unknown }
      w.__kakao = []
      let inited = false
      w.Kakao = { isInitialized: () => inited, init: () => { inited = true }, Share: { sendDefault: (t: unknown) => w.__kakao.push(t) } }
      Object.assign(navigator, { canShare: undefined, share: undefined })
    })
    await faceResult(page)
    await page.getByRole('button', { name: '공유하기' }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { __kakao: unknown[] }).__kakao.length), { timeout: 15000 }).toBe(1)
    const t = await page.evaluate(() => (window as unknown as { __kakao: { content: { title: string; imageUrl: string; link: { mobileWebUrl: string } }; buttons: { title: string }[] }[] }).__kakao[0])
    expect(t.content.title).toMatch(/^나는 .+이래\. 너 관상도 봐줄까\?$/)
    expect(t.content.link.mobileWebUrl).toMatch(/^https:\/\/unse-ai\.com\/face2\/r\/[a-z]+\?utm_source=share/)
    expect(t.content.imageUrl).toMatch(/\/api\/og\/result\?kind=face&key=[a-z]+$/)
    expect(t.buttons[0].title).toBe('나도 해보기')
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  // 운세는 결과 링크 대신 띠별 운세·오늘의 운세 페이지로 보낸다 (생년월일은 링크에 없음)
  for (const c of [
    { name: '신년운세', path: '/fortune', fill: async (page: Page) => { await page.getByPlaceholder('1990').fill('1991'); await page.getByPlaceholder('5', { exact: true }).fill('5'); await page.getByPlaceholder('15', { exact: true }).fill('15') }, link: /^https:\/\/unse-ai\.com\/fortune\/2027\/sheep\?utm_source=share&utm_medium=friend_link&utm_campaign=fortune$/, image: /^https:\/\/unse-ai\.com\/api\/og\?title=2027%EB%85%84/, title: /^2027년 양띠 운세는 '.+'래\. 너도 봐줄까\?$/, test: 'fortune' },
    { name: '오늘의 운세', path: '/fortune/daily', fill: async (page: Page) => { await page.getByPlaceholder('예: 1990').fill('1991') }, link: /^https:\/\/unse-ai\.com\/fortune\/daily\?utm_source=share&utm_medium=friend_link&utm_campaign=daily$/, image: /^https:\/\/unse-ai\.com\/api\/og\?title=/, title: /^오늘 양띠 운세는 '.+'래\. 너도 봐줄까\?$/, test: 'daily' },
  ]) {
    test(`${c.name} 공유하기: 카카오톡 공유 카드(띠 페이지 링크·미리보기 이미지), 생년월일은 보내지 않는다`, async ({ page }) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __kakao: unknown[]; Kakao: unknown }
        w.__kakao = []
        let inited = false
        w.Kakao = { isInitialized: () => inited, init: () => { inited = true }, Share: { sendDefault: (t: unknown) => w.__kakao.push(t) } }
        Object.assign(navigator, { canShare: undefined, share: undefined })
      })
      await page.goto(c.path)
      await c.fill(page)
      await page.getByRole('button', { name: /운세 보기/ }).click()
      await page.getByRole('button', { name: /공유하기/ }).first().click({ timeout: 15000 })
      await expect.poll(() => page.evaluate(() => (window as unknown as { __kakao: unknown[] }).__kakao.length), { timeout: 15000 }).toBe(1)
      const t = await page.evaluate(() => (window as unknown as { __kakao: { content: { title: string; imageUrl: string; link: { mobileWebUrl: string } } }[] }).__kakao[0])
      expect(t.content.title).toMatch(c.title)
      expect(t.content.link.mobileWebUrl).toMatch(c.link)
      expect(t.content.imageUrl).toMatch(c.image)
      expect(JSON.stringify(t)).not.toMatch(/1991|5월 15일/)
      await expect(page.getByRole('status')).toHaveCount(0)
      await expect.poll(() => page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event' && a[1] === 'share_click').map((a) => (a[2] as { method: string }).method))).toEqual(['kakao'])
    })
  }

  test('공유하기: 카카오 SDK를 못 불러오면 링크 복사로 넘어간다', async ({ page, context }) => {
    test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.route('**/t1.kakaocdn.net/**', (r) => r.abort())
    await page.addInitScript(() => { Object.assign(navigator, { canShare: undefined, share: undefined }) })
    await faceResult(page)
    await page.getByRole('button', { name: '공유하기' }).click()
    await expect(page.getByRole('status')).toContainText('링크를 복사했어요', { timeout: 15000 })
  })
})

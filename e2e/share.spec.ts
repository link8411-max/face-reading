import { test, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import { trackErrors } from './helpers'

const FACE = 'public/dev-faces/person1.jpg'

async function faceResult(page: Page) {
  await page.goto('/face2')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('radio', { name: '여자' }).click()
  await page.getByRole('button', { name: '관상 보기' }).click({ timeout: 30000 })
  await expect(page.getByRole('button', { name: '스토리에 올리기' })).toBeVisible({ timeout: 30000 })
}

test.describe('관상 결과: 요약 카드 먼저, 스토리에 올리기', () => {
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
    expect(await y(card)).toBeLessThan(await y(page.getByRole('button', { name: '스토리에 올리기' })))
    expect(errors).toEqual([])
  })

  test('파일 공유 지원: PNG 1장으로 공유 창을 연다', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared: { type: string; name: string }[] }
      w.__shared = []
      Object.assign(navigator, {
        canShare: () => true,
        share: async (d: ShareData) => { w.__shared.push(...(d.files ?? []).map((f) => ({ type: f.type, name: f.name }))) },
      })
    })
    await faceResult(page)
    await page.getByRole('button', { name: '스토리에 올리기' }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared.length), { timeout: 20000 }).toBe(1)
    const f = await page.evaluate(() => (window as unknown as { __shared: { type: string; name: string }[] }).__shared[0])
    expect(f.type).toBe('image/png')
    expect(f.name).toContain('스토리')
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('파일 공유 미지원(PC·인앱): 이미지를 저장하고 안내한다', async ({ page }) => {
    await page.addInitScript(() => { Object.assign(navigator, { canShare: undefined, share: undefined }) })
    await faceResult(page)
    const download = page.waitForEvent('download', { timeout: 20000 })
    await page.getByRole('button', { name: '스토리에 올리기' }).click()
    expect((await download).suggestedFilename()).toMatch(/\.png$/)
    await expect(page.getByRole('status')).toContainText('스토리')
  })

  test('사용자가 공유를 취소하면 아무 안내도 하지 않는다', async ({ page }) => {
    await page.addInitScript(() => {
      Object.assign(navigator, { canShare: () => true, share: async () => { throw new DOMException('cancel', 'AbortError') } })
    })
    await faceResult(page)
    await page.getByRole('button', { name: '스토리에 올리기' }).click()
    await expect(page.getByRole('button', { name: '스토리에 올리기' })).toBeEnabled({ timeout: 20000 })
    await expect(page.getByRole('status')).toHaveCount(0)
  })
})

import { test, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'

const events = (page: Page) => page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]] as [string, Record<string, string>]))

// 공유 버튼 아래(y가 더 큼), 이미지 저장 버튼보다는 위에 있고, 캡처에서 빠진다
async function expectBelowShare(page: Page, shareName: RegExp) {
  const nudge = page.getByRole('link', { name: '친구에게 부적 선물하기' })
  await expect(nudge).toHaveCount(1)
  await expect(nudge).toHaveClass(/no-screenshot/)
  await expect(nudge).toHaveAttribute('href', '/bujeok?mode=gift')
  const share = (await page.getByRole('button', { name: shareName }).boundingBox())!
  const n = (await nudge.boundingBox())!
  expect(n.y).toBeGreaterThanOrEqual(share.y + share.height - 1)
  const save = await page.getByRole('button', { name: '이미지 저장' }).boundingBox()
  if (save) expect(n.y).toBeLessThan(save.y)
  return nudge
}

test('오늘의 운세 결과: 공유 버튼 아래 부적 선물 줄, 누르면 선물 모드로 가고 next_test_click 기록', async ({ page }) => {
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  const nudge = await expectBelowShare(page, /오늘 운세 공유하기/)
  await nudge.click()
  await expect(page).toHaveURL(/\/bujeok\?mode=gift$/)
  await expect(page.getByRole('radio', { name: '선물하기' })).toHaveAttribute('aria-checked', 'true')
  expect((await events(page)).filter(([e]) => e === 'next_test_click')).toEqual([['next_test_click', { test_name: 'bujeok', result_id: 'gift_daily' }]])
})

test('띠 글(/fortune/2027/sheep): 글 아래 공유하기 바로 밑에 부적 선물 줄', async ({ page }) => {
  await page.goto('/fortune/2027/sheep')
  const nudge = page.getByRole('link', { name: '친구에게 부적 선물하기' })
  await expect(nudge).toHaveCount(1)
  const share = (await page.getByRole('button', { name: '공유하기' }).boundingBox())!
  expect((await nudge.boundingBox())!.y).toBeGreaterThanOrEqual(share.y + share.height - 1)
})

for (const path of ['/samguk', '/face2', '/animal', '/face-match', '/samguk/team', '/fortune/daily', '/exam/meme']) {
  test(`${path}: 결과 전(시작 화면)에는 부적 선물 줄이 없다`, async ({ page }) => {
    await page.goto(path)
    await page.waitForTimeout(500)
    await expect(page.getByRole('link', { name: '친구에게 부적 선물하기' })).toHaveCount(0)
  })
}

test('삼국지 결과: 공유하기 아래에 부적 선물 줄이 하나 있고 공유 버튼 위치는 그대로', async ({ page }) => {
  test.skip(!existsSync('public/dev-faces/person1.jpg'), '개발용 얼굴 없음')
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles('public/dev-faces/person1.jpg')
  await page.getByRole('radio', { name: '여자' }).click()
  await page.getByRole('button', { name: /닮은 장수 찾기/ }).click()
  await expect(page.getByRole('button', { name: '공유하기' })).toBeVisible({ timeout: 30000 })
  await expectBelowShare(page, /^공유하기$/)
})

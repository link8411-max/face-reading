import { test, expect } from '@playwright/test'

// 결과가 나오면(다시하기로 돌아가도) 스크롤이 맨 위(0)여야 한다(11/14 사용자 제보: 결과에서 스크롤이 남아 있음).
test.use({ viewport: { width: 390, height: 844 } })

const atTop = async (page: import('@playwright/test').Page) =>
  expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 }).toBe(0)

test('오늘의 운세: 아래로 내려 두고 결과를 보면 맨 위, 다시하기도 맨 위', async ({ page }) => {
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await atTop(page)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: /다시하기/ }).first().click()
  await atTop(page)
})

test('내 사주 풀이: 아래로 내려 두고 결과를 보면 맨 위', async ({ page }) => {
  await page.goto('/saju')
  await page.getByPlaceholder('1990').fill('1992')
  await page.getByPlaceholder('5', { exact: true }).fill('7')
  await page.getByPlaceholder('15').fill('23')
  await page.getByRole('radio', { name: '여자', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('button', { name: /내 사주 보기/ }).click()
  await expect(page.getByRole('button', { name: /공유하기/ }).first()).toBeVisible({ timeout: 15000 })
  await atTop(page)
})

import { test, expect } from '@playwright/test'

test('한국어 페이지의 <html lang>은 ko', async ({ page }) => {
  for (const p of ['/', '/face2', '/saju']) {
    await page.goto(p)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
  }
})

test('/en 아래 페이지의 <html lang>은 en', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

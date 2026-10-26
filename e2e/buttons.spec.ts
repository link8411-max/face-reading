import { test, expect } from '@playwright/test'
import { PAGES, trackErrors } from './helpers'

// 각 페이지에서 보이는 버튼을 하나씩 눌러 보고, 오류 없이 반응하는지 확인한다.
for (const path of PAGES) {
  test(`${path} 버튼을 모두 눌러도 오류가 없다`, async ({ page }) => {
    const errors = trackErrors(page)
    page.on('dialog', (d) => d.dismiss())
    await page.goto(path)
    const count = await page.locator('button:visible').count()
    for (let i = 0; i < count; i++) {
      if (!page.url().endsWith(path === '/' ? '3200/' : path)) await page.goto(path)
      const btn = page.locator('button:visible').nth(i)
      if (!(await btn.count()) || !(await btn.isEnabled())) continue
      const chooser = page.waitForEvent('filechooser', { timeout: 500 }).catch(() => null)
      await btn.click({ timeout: 3000 }).catch(() => {})
      await chooser
      await page.waitForTimeout(200)
      expect(new URL(page.url()).host, `버튼 ${i}`).toBe('localhost:3200')
    }
    expect(errors).toEqual([])
  })
}

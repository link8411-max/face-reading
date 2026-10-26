import { test, expect } from '@playwright/test'

test('본문에 한글 글꼴(Noto Sans KR)과 한지색 배경·먹색 글자가 실제로 적용된다', async ({ page }) => {
  await page.goto('/')
  const s = await page.evaluate(() => { const c = getComputedStyle(document.body); return { font: c.fontFamily, bg: c.backgroundColor, color: c.color } })
  expect(s.font).toMatch(/Noto_Sans_KR|Noto Sans KR/i)
  expect(s.bg).toBe('rgb(251, 246, 238)')
  expect(s.color).toBe('rgb(62, 44, 35)')
})

test('홈 대표 제목(h1)은 사이트 이름과 핵심 키워드, 시즌 문구는 h2', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toContainText('운명을 읽다')
  await expect(page.locator('h1')).toContainText('관상')
  await expect(page.getByRole('heading', { level: 2, name: /붉은 양의 해/ })).toBeVisible()
})

test('띠를 고르면 결과가 스크린리더에 읽힌다(aria-live)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: '띠 바로 고르기' }).locator('[aria-live="polite"]')).toHaveCount(1)
})

import { test, expect } from '@playwright/test'

test('본문에 한글 글꼴(Pretendard)과 새 색 바탕·글자색이 실제로 적용된다', async ({ page }) => {
  await page.goto('/')
  const s = await page.evaluate(() => { const c = getComputedStyle(document.body); return { font: c.fontFamily, bg: c.backgroundColor, color: c.color } })
  expect(s.font).toMatch(/pretendard/i)
  expect(s.bg).toBe('rgb(247, 248, 252)')
  expect(s.color).toBe('rgb(26, 27, 37)')
})

test('홈 대표 제목(h1)은 사이트 이름과 핵심 키워드, 시즌 문구는 h2', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00+09:00')) // 수능 카드 기간 밖: 기본 사주 카드
  await page.goto('/')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toContainText('운명을 읽다')
  await expect(page.locator('h1')).toContainText('관상')
  await expect(page.getByRole('heading', { level: 2, name: /내 사주,\s*쉬운 말로/ })).toBeVisible()
})

test('홈 시즌 문구(수능 기간)도 h2', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T10:00:00+09:00'))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2, name: /수험생에게\s*합격 부적 보내기/ })).toBeVisible()
})

test('띠를 고르면 결과가 스크린리더에 읽힌다(aria-live)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: '띠 바로 고르기' }).locator('[aria-live="polite"]')).toHaveCount(1)
})

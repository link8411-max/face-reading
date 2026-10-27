import { test, expect } from '@playwright/test'

test('수능 시즌(11/1): 오늘의 운세 결과에 합격 선물 카드, 누르면 새 창·coupang_click 기록', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-01T10:00:00+09:00'))
  await context.route('**/link.coupang.com/**', (r) => r.fulfill({ status: 200, body: 'ok' }))
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  const card = page.getByRole('region', { name: '합격 기원 선물 모아보기' })
  await expect(card).toContainText('수능 D-18')
  await expect(card.getByRole('link')).toHaveCount(4)
  await expect(card.getByRole('link', { name: '합격엿' })).toHaveAttribute('rel', 'sponsored noopener')
  const popup = page.waitForEvent('popup')
  await card.getByRole('link', { name: '합격엿' }).click()
  await (await popup).close()
  await expect.poll(() => page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event' && a[1] === 'coupang_click').map((a) => a[2]))).toEqual([{ slot: 'daily', keyword: 'yeot' }])
})

test('수능 다음 다음 날(11/21)부터는 시즌 카드가 숨는다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-21T09:00:00+09:00'))
  await page.goto('/')
  await page.waitForTimeout(800)
  await expect(page.getByRole('region', { name: '합격 기원 선물 모아보기' })).toHaveCount(0)
})

import { test, expect, type Page } from '@playwright/test'

// 서비스 워커가 실제 쿠팡 위젯을 대신 받으면 가짜 배너가 적용되지 않으므로 끈다
test.use({ serviceWorkers: 'block' })

const events = (page: Page, name: string) =>
  page.evaluate((n) => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event' && a[1] === n).map((a) => a[2]), name)

test('쿠팡 다이나믹 배너: 화면에 보이면 노출, 배너를 누르면 클릭을 위치(slot)와 함께 기록', async ({ page, context }) => {
  // 실제 쿠팡 위젯 대신 누를 수 있는 가짜 배너
  await context.route('**/ads-partners.coupang.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>상품</p>' }))
  await page.goto('/')
  await expect.poll(() => events(page, 'coupang_banner_view')).toEqual([])
  const frame = page.locator('iframe[title="쿠팡 추천 상품"]')
  await frame.scrollIntoViewIfNeeded()
  await expect.poll(() => events(page, 'coupang_banner_view')).toEqual([{ slot: 'home' }])
  // 배너(다른 도메인 iframe)를 누르면 창의 초점이 iframe으로 옮겨 간다 — 그 순간을 클릭으로 기록하는지 본다
  await frame.focus()
  await expect.poll(() => events(page, 'coupang_click')).toEqual([{ slot: 'home', keyword: 'banner' }])
})

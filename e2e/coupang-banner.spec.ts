import { test, expect, type Page } from '@playwright/test'

// 서비스 워커가 실제 쿠팡 위젯을 대신 받으면 가짜 배너가 적용되지 않으므로 끈다
test.use({ serviceWorkers: 'block' })

const events = (page: Page, name: string) =>
  page.evaluate((n) => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event' && a[1] === n).map((a) => a[2]), name)

test('쿠팡 다이나믹 배너: 위젯이 노출을 알리면 widget 노출, 배너를 누르면 클릭을 위치(slot)와 함께 기록', async ({ page, context }) => {
  // 실제 쿠팡 위젯 대신 노출 메시지를 보내는 누를 수 있는 가짜 배너
  await context.route('**/ads-partners.coupang.com/**', (r) => r.fulfill({
    contentType: 'text/html',
    body: `<p>상품</p><script>parent.postMessage(JSON.stringify({type:'adDisplayed',id:'1043563'}),'*')</script>`,
  }))
  await page.goto('/')
  await expect.poll(() => events(page, 'coupang_banner_view')).toEqual([])
  const frame = page.locator('iframe[title="쿠팡 추천 상품"]')
  await frame.scrollIntoViewIfNeeded()
  await expect.poll(() => events(page, 'coupang_banner_view')).toEqual([{ slot: 'home', keyword: 'widget' }])
  // 배너(다른 도메인 iframe)를 누르면 창의 초점이 iframe으로 옮겨 간다 — 그 순간을 클릭으로 기록하는지 본다
  await frame.focus()
  await expect.poll(() => events(page, 'coupang_click')).toEqual([{ slot: 'home', keyword: 'banner' }])
})

test('쿠팡 배너가 빈 채로 남으면 일반 제휴 링크로 바꾸고 links 노출·링크 클릭을 기록', async ({ page, context }) => {
  // 노출 메시지를 보내지 않는 빈 위젯 (서드파티 쿠키 차단 브라우저)
  await context.route('**/ads-partners.coupang.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p></p>' }))
  await context.route('**/link.coupang.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>coupang</p>' }))
  await page.goto('/')
  const frame = page.locator('iframe[title="쿠팡 추천 상품"]')
  await frame.scrollIntoViewIfNeeded()
  const link = page.getByRole('link', { name: '쿠팡 오늘의 특가 보기' })
  await expect(link).toBeVisible({ timeout: 10_000 })
  await expect(frame).toHaveCount(0)
  await expect.poll(() => events(page, 'coupang_banner_view')).toEqual([{ slot: 'home', keyword: 'links' }])
  const popup = context.waitForEvent('page')
  await link.click()
  await popup
  await expect.poll(() => events(page, 'coupang_click')).toContainEqual({ slot: 'home', keyword: 'home' })
})

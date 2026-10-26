import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

test('얼굴 히어로 → 관상, 시즌 카드 → 신년운세', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /내 얼굴에는/ })).toBeVisible()
  await page.getByRole('link', { name: '내 얼굴 보러 가기' }).click()
  await expect(page).toHaveURL(/\/face2$/)
  await page.goto('/')
  await page.getByRole('link', { name: /지금 확인하기/ }).click()
  await expect(page).toHaveURL(/\/fortune$/)
})

test('띠 바로 고르기: 양띠를 누르면 오늘의 운세가 메인에 나오고 두 링크로 이어진다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  const picker = page.getByRole('region', { name: '띠 바로 고르기' })
  await picker.getByRole('button', { name: /양/ }).click()
  await expect(picker.getByText(/양띠 오늘의 한마디/)).toBeVisible()
  await expect(picker.getByRole('link', { name: /오늘의 운세 자세히/ })).toHaveAttribute('href', '/fortune/daily')
  await expect(picker.getByRole('link', { name: /2027 양띠 운세/ })).toHaveAttribute('href', '/fortune/2027/sheep')
  expect(errors).toEqual([])
})

test('묶음 탭 전환: 운세·사주를 누르면 운세 항목이 보인다', async ({ page }) => {
  await page.goto('/')
  const tabs = page.getByRole('region', { name: '테스트 묶음' })
  await expect(tabs.locator('a[href="/samguk"]')).toBeVisible()
  await tabs.getByRole('tab', { name: '운세·사주' }).click()
  await expect(tabs.locator('a[href="/fortune/daily"]')).toBeVisible()
  await tabs.getByRole('tab', { name: 'MBTI' }).click()
  await expect(tabs.locator('a[href="/mbti/match"]')).toBeVisible()
})

test('홈에서 6개 테스트에 두 번 탭 이내로 도달', async ({ page }) => {
  const reach = async (href: string) => {
    await page.goto('/')
    const direct = page.locator(`main a[href="${href}"]:visible`).first()
    if (await direct.count()) { await direct.click() } else {
      await page.getByRole('region', { name: '테스트 묶음' }).getByRole('tab', { name: '운세·사주' }).click()
      await page.locator(`main a[href="${href}"]:visible`).first().click()
    }
    await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, '\\/')}$`))
  }
  for (const href of ['/samguk', '/animal', '/face2', '/fortune', '/fortune/2027', '/fortune/daily']) await reach(href)
})

test('홈: hydration 오류 없음', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await page.waitForTimeout(800)
  expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([])
})

test('홈 순서: 히어로 → 친구랑 같이 → 띠 고르기 → 쿠팡 배너 → 묶음 탭 (배너가 첫 흐름을 막지 않는다)', async ({ page }) => {
  await page.goto('/')
  const y = async (loc: import('@playwright/test').Locator) => (await loc.boundingBox())!.y
  const together = await y(page.getByRole('region', { name: '친구랑 같이 해봐요' }))
  const picker = await y(page.getByRole('region', { name: '띠 바로 고르기' }))
  const banner = await y(page.locator('iframe[title="쿠팡 추천 상품"]'))
  const tabs = await y(page.getByRole('region', { name: '테스트 묶음' }))
  expect(together).toBeLessThan(picker)
  expect(picker).toBeLessThan(banner)
  expect(banner).toBeLessThan(tabs)
})

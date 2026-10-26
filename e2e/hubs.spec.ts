import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

for (const [path, h1, links] of [
  ['/face-tests', '얼굴 테스트', ['/samguk', '/animal', '/face2']],
  ['/unse', '운세·사주', ['/fortune', '/fortune/2027', '/fortune/daily']],
] as const) {
  test(`${path} 허브: 항목 링크가 모두 있고 이동된다`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(path)
    await expect(page.locator('h1')).toHaveText(h1)
    for (const href of links) await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible()
    await page.locator(`main a[href="${links[0]}"]`).first().click()
    await expect(page).toHaveURL(new RegExp(`${links[0]}$`))
    expect(errors).toEqual([])
  })
}

test('/mbti 허브: 검색 허용, 궁합 계산기와 16유형으로 이어진다', async ({ page }) => {
  await page.goto('/mbti')
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
  await expect(page.locator('main a[href="/mbti/match"]')).toBeVisible()
  await expect(page.locator('main a[href="/mbti/infp"]')).toBeVisible()
})

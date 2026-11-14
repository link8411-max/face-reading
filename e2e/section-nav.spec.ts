import { test, expect } from '@playwright/test'

// 11/14 사용자: "따라다니면서 스크롤로 이동시켜 주는 탭". 긴 상세 페이지의 단락 탭이 위에 붙어 따라오고, 누르면 그 단락 머리로 간다.
test.use({ viewport: { width: 390, height: 664 } })

for (const [path, id, label] of [
  ['/mbti/infp', 'sec-match', '궁합'],
  ['/fortune/2027/rat', 'sec-match', '궁합'],
  ['/samguk/people/guanyu', 'cheer', '응원'],
] as const) {
  test(`${path}: "${label}" 탭을 누르면 그 단락으로 가고 탭은 화면 위에 붙어 있다`, async ({ page }) => {
    await page.goto(path)
    const nav = page.locator('[data-section-nav]')
    await nav.getByText(label, { exact: true }).click()
    await expect.poll(async () => Math.round((await page.locator(`[id="${id}"]`).boundingBox())!.y), { timeout: 4000 }).toBeLessThan(90)
    expect((await nav.boundingBox())!.y).toBeLessThanOrEqual(1)
    await expect(nav.locator(`[data-section-tab="${id}"]`)).toHaveAttribute('aria-current', 'true')
  })
}

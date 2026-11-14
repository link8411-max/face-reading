import { test, expect } from '@playwright/test'

// 11/14 사용자: "첫 화면에 나와야 한다, 스크롤을 누가 하겠어 처음부터".
// 실제 휴대폰 브라우저에서 보이는 높이(아이폰 사파리 390×664, 아이폰 SE 375×667)로, 시작 화면의 주 버튼이 하단 탭바 위에 다 보여야 한다.
const SIZES = [{ width: 390, height: 664 }, { width: 375, height: 667 }]
const PAGES = ['/animal', '/face2', '/face-match', '/samguk', '/saju', '/fortune', '/fortune/daily']

for (const size of SIZES) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size })
    for (const path of PAGES) {
      test(`${path}: 주 버튼이 첫 화면(탭바 위)에 들어온다`, async ({ page }) => {
        await page.goto(path)
        const btn = page.locator('main button.bg-accent:visible').first()
        await expect(btn).toBeVisible()
        const box = (await btn.boundingBox())!
        const bar = (await page.locator('nav').last().boundingBox())!
        expect(box.y + box.height, `${path} 버튼 아래 끝`).toBeLessThanOrEqual(bar.y)
      })
    }
  })
}

test.describe('설명 탭', () => {
  test.use({ viewport: { width: 390, height: 664 } })
  test('/animal: 설명 글은 설명 탭을 눌러야 보인다', async ({ page }) => {
    await page.goto('/animal')
    await expect(page.locator('[data-page-guide]')).toBeHidden()
    await page.getByRole('tab', { name: '설명' }).click()
    await expect(page.locator('[data-page-guide]')).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

// 11/14 사용자: "캐릭터 때문에 메뉴가 너무 밀렸다, 스크롤 압박이 심하다".
// 375×812 휴대폰 첫 화면에서 사진 테스트의 분석 버튼이 하단 탭바 위에 다 보여야 한다.
test.use({ viewport: { width: 375, height: 812 } })

for (const path of ['/animal', '/face2']) {
  test(`${path}: 분석 버튼이 첫 화면(탭바 위)에 들어온다, 미리보기·설명은 탭으로`, async ({ page }) => {
    await page.goto(path)
    const btn = page.getByRole('button', { name: /사진을 먼저 골라|성별을 먼저 골라/ })
    const box = (await btn.boundingBox())!
    const bar = (await page.locator('nav').last().boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(bar.y)
    await expect(page.locator('[data-page-guide]')).toBeHidden()
    await page.getByRole('tab', { name: '설명' }).click()
    await expect(page.locator('[data-page-guide]')).toBeVisible()
    await expect(btn).toBeHidden()
  })
}

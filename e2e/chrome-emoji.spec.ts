import { test, expect } from '@playwright/test'

// 제목·버튼·링크(UI 크롬)에 이모지를 쓰지 않는다 (선 아이콘으로 대체)
for (const path of ['/', '/face-tests', '/unse', '/fortune', '/fortune/daily', '/fortune/2027', '/fortune/2027/sheep', '/mbti', '/mbti/infp', '/mbti/match', '/face2', '/animal', '/samguk', '/about', '/privacy', '/face-match', '/samguk/team', '/fortune/mbti']) {
  test(`${path}: 제목·버튼·링크에 이모지가 없다`, async ({ page }) => {
    await page.goto(path)
    const texts = await page.locator('main h1, main h2, main h3, main button, main a, nav a').allInnerTexts()
    const bad = texts.filter((t) => /\p{Extended_Pictographic}/u.test(t))
    expect(bad).toEqual([])
  })
}

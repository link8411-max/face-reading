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

// 결과 화면에도 같은 탭(11/14 사용자 "그래 넣어줘")
test('내 사주 풀이 결과: 단락 탭으로 "올해"에 가고 탭은 위에 붙어 있다', async ({ page }) => {
  await page.goto('/saju')
  await page.getByPlaceholder('1990').fill('1992')
  await page.getByPlaceholder('5', { exact: true }).fill('7')
  await page.getByPlaceholder('15').fill('23')
  await page.getByRole('button', { name: '다음으로' }).click()
  await page.getByRole('button', { name: '다음으로' }).click()
  await page.getByRole('radio', { name: '여자', exact: true }).click()
  await page.getByRole('button', { name: /내 사주 보기/ }).click()
  const nav = page.locator('[data-section-nav]')
  await expect(nav).toBeVisible({ timeout: 15000 })
  await nav.getByText('올해', { exact: true }).click()
  await expect.poll(async () => Math.round((await page.locator('[id="sec-seun"]').boundingBox())!.y), { timeout: 4000 }).toBeLessThan(90)
  expect((await nav.boundingBox())!.y).toBeLessThanOrEqual(1)
})

test('신년운세 결과: 단락 탭으로 "조언"에 간다', async ({ page }) => {
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15').fill('15')
  await page.getByRole('button', { name: '운세 보기' }).click()
  const nav = page.locator('[data-section-nav]')
  await expect(nav).toBeVisible({ timeout: 15000 })
  await nav.getByText('조언', { exact: true }).click()
  await expect.poll(async () => Math.round((await page.locator('[id="fy-advice"]').boundingBox())!.y), { timeout: 4000 }).toBeLessThan(90)
})

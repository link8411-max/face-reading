import { test, expect } from '@playwright/test'
import { PAGES, TEST_PAGES, trackErrors } from './helpers'

for (const path of PAGES) {
  test(`${path} 열림 + 오류 없음`, async ({ page }) => {
    const errors = trackErrors(page)
    const res = await page.goto(path)
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })

  test(`${path} 내부 링크가 모두 살아 있다`, async ({ page, request }) => {
    await page.goto(path)
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href')!))])
    for (const href of hrefs) {
      const r = await request.get(href)
      expect(r.status(), href).toBeLessThan(400)
    }
  })
}

test('홈 → 각 테스트 → 돌아가기 → 홈', async ({ page }) => {
  for (const path of TEST_PAGES) {
    await page.goto('/')
    // 4a 새 메인: 운세 항목은 '운세·사주' 묶음 탭 안에 있다
    const direct = page.locator(`main a[href="${path}"]:visible`).first()
    if (!(await direct.count())) await page.getByRole('region', { name: '테스트 묶음' }).getByRole('tab', { name: '운세·사주' }).click()
    await page.locator(`main a[href="${path}"]:visible`).first().click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await page.getByRole('button', { name: /돌아가기/ }).click()
    await expect(page).toHaveURL(/\/$/)
  }
})

for (const path of TEST_PAGES) {
  test(`${path}에 검색으로 바로 들어와도 돌아가기가 홈으로 간다`, async ({ page }) => {
    await page.goto(path)
    await page.getByRole('button', { name: /돌아가기/ }).click()
    await expect(page).toHaveURL(/localhost:3200\/$/)
  })
}

test('예전 /face 주소는 /face2로 이동', async ({ page }) => {
  await page.goto('/face')
  await expect(page).toHaveURL(/\/face2$/)
})

test('검색으로 들어와 다른 페이지를 갔다가 브라우저 뒤로 돌아온 뒤에도 돌아가기는 사이트 안에 머문다', async ({ page }) => {
  await page.goto('/fortune')
  await page.locator('section a[href="/face2"]').first().click()
  await expect(page).toHaveURL(/\/face2$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/fortune$/)
  await page.getByRole('button', { name: /돌아가기/ }).click()
  await expect(page).toHaveURL(/localhost:3200\/$/)
})

test('사이트 자체 파일(이미지·모델 등)에서 404가 나지 않는다', async ({ page }) => {
  const bad: string[] = []
  page.on('response', (r) => { if (r.url().startsWith('http://localhost:3200') && !r.url().includes('/_vercel/') && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`) })
  for (const path of ['/', '/face2', '/animal', '/samguk', '/fortune', '/fortune/daily']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(bad).toEqual([])
})

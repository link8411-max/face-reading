import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

const CASES: [string, string][] = [['/', '홈'], ['/face2', '얼굴'], ['/samguk', '얼굴'], ['/fortune', '운세'], ['/fortune/daily', '운세'], ['/fortune/2027/sheep', '운세'], ['/about', '홈']]

for (const [path, label] of CASES) {
  test(`${path}: 하단 탭바가 있고 "${label}" 탭이 현재 탭`, async ({ page }) => {
    await page.goto(path)
    const bar = page.getByRole('navigation', { name: '하단 메뉴' })
    await expect(bar).toBeVisible()
    await expect(bar.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })
}

test('탭을 눌러 묶음 페이지로 이동', async ({ page }) => {
  await page.goto('/')
  const bar = page.getByRole('navigation', { name: '하단 메뉴' })
  for (const [label, url] of [['얼굴', /\/face-tests$/], ['운세', /\/unse$/], ['궁합', /\/mbti$/], ['홈', /3200\/$/]] as const) {
    await bar.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(url)
  }
})

test('결과 화면 맨 아래 버튼·배너가 탭바에 가리지 않는다', async ({ page }) => {
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const barTop = (await page.getByRole('navigation', { name: '하단 메뉴' }).boundingBox())!.y
  const footer = page.locator('footer')
  const footerBottom = await footer.evaluate((el) => el.getBoundingClientRect().bottom)
  expect(footerBottom).toBeLessThanOrEqual(barTop + 1)
})

test('삼국지 결과 저장 이미지에 탭바가 섞이지 않는다(no-screenshot)', async ({ page }) => {
  test.skip(!existsSync('public/dev-faces/person1.jpg'), '개발용 얼굴 없음')
  await page.goto('/samguk')
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveClass(/no-screenshot/)
})

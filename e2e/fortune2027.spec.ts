import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

const SLUGS = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig']

test('2027 띠별 운세 허브와 12개 페이지가 열리고 구조화 데이터가 하나씩 있다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune/2027')
  await expect(page.locator('h1')).toHaveText('2027 띠별 운세')
  for (const s of SLUGS) {
    const res = await page.goto(`/fortune/2027/${s}`)
    expect(res?.status(), s).toBe(200)
    await expect(page.locator('h1')).toContainText('2027년')
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.flatMap((e) => [JSON.parse(e.textContent || 'null')].flat()).map((j) => j?.['@type']))
    expect(types.filter((t) => t === 'FAQPage'), s).toHaveLength(1)
    expect(types.filter((t) => t === 'BreadcrumbList'), s).toHaveLength(1)
  }
  expect(errors).toEqual([])
})

test('없는 띠 주소는 404', async ({ page }) => {
  const res = await page.goto('/fortune/2027/cat')
  expect(res?.status()).toBe(404)
})

test('홈 → 띠별 운세 → 양띠 → 사주로 자세히 보기', async ({ page }) => {
  await page.goto('/')
  await page.locator('main a[href="/fortune/2027"]').first().click()
  await expect(page).toHaveURL(/\/fortune\/2027$/)
  await page.locator('a[href="/fortune/2027/sheep"]').click()
  await expect(page.locator('h1')).toHaveText('2027년 양띠 운세')
  await page.getByRole('link', { name: /사주로 2027 운세 자세히 보기/ }).click()
  await expect(page).toHaveURL(/\/fortune$/)
})

test('신년운세 결과에서 내 띠 2027 운세로 이동', async ({ page }) => {
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1991')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15', { exact: true }).fill('15')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await page.getByRole('link', { name: /양띠 2027 운세 자세히 보기/ }).click()
  await expect(page).toHaveURL(/\/fortune\/2027\/sheep$/)
})

test('음력 윤달 입력: 없는 날짜는 안내, 있는 날짜는 양력 변환 표시', async ({ page }) => {
  await page.goto('/fortune')
  await page.getByRole('button', { name: /음력/ }).click()
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('4')
  await page.getByPlaceholder('15', { exact: true }).fill('21')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByText('양력 1990년 5월 15일로 계산했어요')).toBeVisible()
})

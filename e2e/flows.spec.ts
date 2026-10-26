import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { blankPng, trackErrors } from './helpers'

test('신년운세: 입력 → 결과 → 다시하기는 같은 페이지 입력 화면으로', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15', { exact: true }).fill('15')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /다시하기/ }).first().click()
  await expect(page).toHaveURL(/\/fortune$/)
  await expect(page.getByPlaceholder('1990')).toBeVisible()
  await page.getByRole('button', { name: /돌아가기/ }).click()
  await expect(page).toHaveURL(/3200\/$/)
  expect(errors).toEqual([])
})

test('오늘의 운세: 입력 → 결과 → 다시하기', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /다시하기/ }).first().click()
  await expect(page).toHaveURL(/\/fortune\/daily$/)
  await expect(page.getByPlaceholder('예: 1990')).toBeVisible()
  expect(errors).toEqual([])
})

test('삼국지: 성별 선택 전에는 시작 불가, 얼굴 없는 사진은 안내 후 로딩 종료', async ({ page }) => {
  const errors = trackErrors(page)
  const dialogs: string[] = []
  page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss() })
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: await blankPng(page) })
  await expect(page.getByRole('button', { name: /성별을 먼저/ })).toBeDisabled()
  await page.getByRole('button', { name: '남성 인물' }).click()
  await page.getByRole('button', { name: /영웅 탐색 시작/ }).click()
  await expect.poll(() => dialogs.join(), { timeout: 30000 }).toContain('얼굴을 찾지 못했어요')
  await expect(page.getByRole('button', { name: /영웅 탐색 시작/ })).toBeVisible()
  expect(errors).toEqual([])
})

const FACE = 'public/dev-faces/person1.jpg'
test('삼국지: 실제 얼굴 → 결과 → 다시하기는 업로드 화면으로', async ({ page }) => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
  const errors = trackErrors(page)
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('button', { name: '여성 인물' }).click()
  await page.getByRole('button', { name: /영웅 탐색 시작/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ })).toBeVisible({ timeout: 30000 })
  await expect(page.getByText(/^\d{2}%$/).first()).toBeVisible()
  await page.getByRole('button', { name: /다시하기/ }).click()
  await expect(page).toHaveURL(/\/samguk$/)
  await expect(page.getByRole('button', { name: '여성 인물' })).toBeVisible()
  expect(errors).toEqual([])
})

for (const path of ['/face2', '/animal']) {
  test(`${path}: 얼굴 없는 사진도 멈추지 않고 안내`, async ({ page }) => {
    const errors = trackErrors(page)
    page.on('dialog', (d) => d.dismiss())
    await page.goto(path)
    await page.locator('input[type=file]').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: await blankPng(page) })
    await page.getByRole('button', { name: /분석하기|찾기/ }).last().click()
    await expect(page.getByText('얼굴을 감지할 수 없습니다')).toBeVisible({ timeout: 30000 })
    expect(errors).toEqual([])
  })
}

// 결과 화면의 저장·공유 등 나머지 버튼도 모두 눌러 본다 (다시하기/돌아가기는 위 흐름에서 확인)
async function clickResultButtons(page: import('@playwright/test').Page) {
  page.on('dialog', (d) => d.dismiss())
  await page.evaluate(() => { (navigator as unknown as { share?: unknown }).share = undefined })
  // 누르는 동안 화면이 바뀌어 순서가 달라질 수 있으니, 라벨 목록을 먼저 뽑고 라벨로 다시 찾는다
  const labels = (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && !/다시하기|돌아가기/.test(t))
  for (const label of [...new Set(labels)]) {
    const b = page.getByRole('button', { name: label, exact: true }).first()
    if (!(await b.isVisible().catch(() => false)) || !(await b.isEnabled())) continue
    const download = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    await b.click({ timeout: 5000 })
    await download
    await expect(page.locator('text=/캡쳐중|저장 중/')).toHaveCount(0, { timeout: 15000 })
    expect(new URL(page.url()).host, label).toBe('localhost:3200')
  }
}

test('신년운세 결과 화면 버튼을 모두 눌러도 오류가 없다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15', { exact: true }).fill('15')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await clickResultButtons(page)
  expect(errors).toEqual([])
})

test('오늘의 운세 결과 화면 버튼을 모두 눌러도 오류가 없다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await clickResultButtons(page)
  expect(errors).toEqual([])
})

test('삼국지 결과 화면 버튼(탭·저장·공유)을 모두 눌러도 오류가 없다', async ({ page }) => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
  const errors = trackErrors(page)
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('button', { name: '남성 인물' }).click()
  await page.getByRole('button', { name: /영웅 탐색 시작/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ })).toBeVisible({ timeout: 30000 })
  await clickResultButtons(page)
  expect(errors).toEqual([])
})

import { test, expect } from '@playwright/test'

test('신년운세 생년월일: 숫자·자릿수 제한, 자동 이동, 잘못된 날짜 안내, 버튼 비활성', async ({ page }) => {
  await page.goto('/fortune')
  const year = page.getByPlaceholder('1990'), month = page.getByPlaceholder('5', { exact: true }), day = page.getByPlaceholder('15', { exact: true })
  const submit = page.getByRole('button', { name: /운세 보기/ })
  await expect(submit).toBeDisabled()

  await year.fill('19901234')
  await expect(year).toHaveValue('1990')
  await year.fill('')
  await year.pressSequentially('1990')
  await expect(month).toBeFocused()

  await month.pressSequentially('02')
  await expect(day).toBeFocused()
  await day.pressSequentially('31')
  await expect(page.getByText('2월은 28일까지 있어요')).toBeVisible()
  await expect(submit).toBeDisabled()

  await day.fill('28')
  await expect(page.getByText('2월은 28일까지 있어요')).toHaveCount(0)
  await expect(submit).toBeEnabled()

  await year.fill('3000')
  await expect(page.getByText(/1900~\d{4}년 사이로/)).toBeVisible()
  await expect(submit).toBeDisabled()
  await expect(year).toHaveAttribute('inputmode', 'numeric')
})

test('오늘의 운세 출생년도: 4자리 제한, 범위 안내, 올해생 허용', async ({ page }) => {
  await page.goto('/fortune/daily')
  const year = page.getByPlaceholder('예: 1990')
  const submit = page.getByRole('button', { name: /운세 보기/ })
  await expect(submit).toBeDisabled()
  await year.pressSequentially('1234567')
  await expect(year).toHaveValue('1234')
  await expect(page.getByText(/1900~\d{4}년 사이로/)).toBeVisible()
  await year.fill(String(new Date().getFullYear()))
  await expect(submit).toBeEnabled()
  await expect(year).toHaveAttribute('inputmode', 'numeric')
})

import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

const SLUGS = ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp']

test('MBTI 허브와 16유형 페이지: 200, FAQ 구조화 데이터 1개, MBTI 탭 강조', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/mbti')
  await expect(page.locator('h1')).toContainText('MBTI')
  await expect(page.getByRole('navigation', { name: '하단 메뉴' }).getByRole('link', { name: '궁합' })).toHaveAttribute('aria-current', 'page')
  for (const s of SLUGS) {
    const res = await page.goto(`/mbti/${s}`)
    expect(res?.status(), s).toBe(200)
    await expect(page.locator('h1')).toContainText(s.toUpperCase())
    const faq = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.filter((e) => (e.textContent || '').includes('"FAQPage"')).length)
    expect(faq, s).toBe(1)
  }
  expect(errors).toEqual([])
})

test('없는 유형 주소는 404', async ({ page }) => {
  expect((await page.goto('/mbti/abcd'))?.status()).toBe(404)
})

test('궁합 계산기: INFP + ENFJ → 점수·문장, 같은 선택은 같은 점수, 저장 이미지에 주소', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/mbti/match')
  const submit = page.getByRole('button', { name: /궁합 보기/ })
  await expect(submit).toBeDisabled()
  await page.getByRole('group', { name: '나의 MBTI' }).getByRole('button', { name: 'INFP' }).click()
  await page.getByRole('group', { name: '상대의 MBTI' }).getByRole('button', { name: 'ENFJ' }).click()
  await submit.click()
  const result = page.getByRole('region', { name: '궁합 결과' })
  await expect(result).toContainText('INFP')
  await expect(result).toContainText('ENFJ')
  const score = await result.getByTestId('total-score').innerText()
  expect(Number(score)).toBeGreaterThanOrEqual(55)
  await expect(result).toContainText('unse-ai.com')
  await page.getByRole('button', { name: /다시 고르기/ }).click()
  await page.getByRole('group', { name: '나의 MBTI' }).getByRole('button', { name: 'INFP' }).click()
  await page.getByRole('group', { name: '상대의 MBTI' }).getByRole('button', { name: 'ENFJ' }).click()
  await page.getByRole('button', { name: /궁합 보기/ }).click()
  await expect(page.getByRole('region', { name: '궁합 결과' }).getByTestId('total-score')).toHaveText(score)
  expect(errors).toEqual([])
})

test('유형 페이지 → 궁합 계산기 → 결과에서 유형 페이지로', async ({ page }) => {
  await page.goto('/mbti/intj')
  await page.getByRole('link', { name: /궁합 계산기/ }).first().click()
  await expect(page).toHaveURL(/\/mbti\/match/)
})

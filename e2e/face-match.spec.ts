import { test, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import { blankPng, trackErrors } from './helpers'

const F = 'public/dev-faces/person2.jpg' // 정면 여성
const M = 'public/dev-faces/person6.jpg' // 정면 남성
const has = existsSync(F) && existsSync(M)

async function fill(page: Page, label: string, gender: '여자' | '남자', file: string | { name: string; mimeType: string; buffer: Buffer }) {
  const slot = page.getByRole('region', { name: label })
  await slot.getByRole('radio', { name: gender }).click()
  await slot.locator('input[type=file]').setInputFiles(file)
}

test('한 폰: 연인 궁합 — 두 사진 → 결과 카드(연인 점수 크게, 다른 관계 작게) → 공유하기는 결과 링크', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  const errors = trackErrors(page)
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: ShareData[] }
    w.__shared = []
    Object.assign(navigator, { canShare: () => true, share: async (d: ShareData) => { w.__shared.push({ text: d.text, url: d.url }) } })
  })
  await page.goto('/face-match')
  await expect(page.getByRole('button', { name: '어떤 사이인지 먼저 골라 주세요' })).toBeDisabled()
  await page.getByRole('radio', { name: '연인' }).click()
  await fill(page, '나', '여자', F)
  await fill(page, '내 사람', '남자', M)
  await page.getByRole('button', { name: '궁합 보기' }).click()
  const card = page.locator('article').first()
  await expect(card).toContainText(/연인 궁합 \d+점/, { timeout: 30000 })
  await expect(card).toContainText(/친구 \d+점 · 짝사랑 \d+점/)
  await expect(card).toContainText('unse-ai.com')
  await page.getByRole('button', { name: '공유하기' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared[0]?.url ?? '')).toMatch(/\/face-match\/r\/[a-z]+-[a-z]+\?rel=lover/)
  expect(errors).toEqual([])
})

test('짝사랑: 칸 이름 "그 사람", 상대에게 알림 없음 안내, 초대 링크는 없다', async ({ page }) => {
  await page.goto('/face-match?me=cat')
  await page.getByRole('radio', { name: '짝사랑' }).click()
  await expect(page.getByRole('region', { name: '그 사람' })).toBeVisible()
  await expect(page.getByText(/상대에게 알림도 가지 않아요/)).toBeVisible()
  await expect(page.getByRole('button', { name: '친구에게 초대 링크 보내기' })).toHaveCount(0)
  await page.getByRole('radio', { name: '친구' }).click()
  await expect(page.getByRole('button', { name: '친구에게 초대 링크 보내기' })).toBeVisible()
  await expect(page.getByRole('region', { name: '나' })).toContainText('고양이상 결과로 볼게요')
})

test('초대 링크: 친구가 신청한 궁합에 내 사진만 올려 결과', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  await page.goto('/face-match/i/cat?rel=friend&utm_source=share&utm_medium=friend_link')
  await expect(page.getByText('친구가 궁합을 보자고 해요.')).toBeVisible()
  await expect(page.getByRole('region', { name: '친구' })).toContainText('고양이상 결과로 볼게요')
  await fill(page, '나', '남자', M)
  await page.getByRole('button', { name: '궁합 보기' }).click()
  await expect(page.locator('article').first()).toContainText(/친구 궁합 \d+점/, { timeout: 30000 })
})

test('한 칸이 실패하면 그 칸에만 안내하고 다른 칸 사진은 그대로', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  await page.goto('/face-match')
  await page.getByRole('radio', { name: '친구' }).click()
  await fill(page, '나', '여자', F)
  await fill(page, '친구', '여자', { name: 'blank.png', mimeType: 'image/png', buffer: await blankPng(page) })
  await page.getByRole('button', { name: '궁합 보기' }).click()
  await expect(page.getByRole('region', { name: '친구' }).getByRole('alert')).toContainText('얼굴을 찾지 못했어요', { timeout: 30000 })
  await expect(page.getByRole('region', { name: '나' }).getByRole('img')).toBeVisible()
  await expect(page.getByRole('region', { name: '나' }).getByRole('alert')).toHaveCount(0)
})

test('결과·초대 공유 링크: 미리보기 메타, 잘못된 값은 시작 화면, 미리보기 이미지', async ({ page, request }) => {
  await page.goto('/face-match/r/cat-fox?rel=crush')
  expect(await page.locator('meta[property="og:title"]').first().getAttribute('content')).toMatch(/^나 짝사랑 성공 가능성 \d+% 나왔어/)
  expect(await page.locator('meta[name="robots"]').first().getAttribute('content')).toContain('noindex')
  await page.getByRole('link', { name: '나도 해보기' }).click()
  await expect(page).toHaveURL(/\/face-match$/)
  await page.goto('/face-match/i/cat?rel=crush')
  await expect(page).toHaveURL(/\/face-match$/)
  expect((await request.get('/api/og/result?kind=face-match&a=cat&b=fox&rel=lover')).status()).toBe(200)
  expect((await request.get('/api/og/result?kind=invite&key=cat&rel=friend')).status()).toBe(200)
  expect((await request.get('/api/og/result?kind=invite&key=cat&rel=crush')).status()).toBe(400)
})

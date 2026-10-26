import { test, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'

const events = (page: Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]] as [string, Record<string, string>]))

test('모든 페이지에 gtag가 있고, 로컬에서는 실제 통계로 보내지 않는다', async ({ page }) => {
  const collect: string[] = []
  page.on('request', (r) => { if (/google-analytics\.com\/g\/collect/.test(r.url())) collect.push(r.url()) })
  for (const path of ['/', '/animal', '/fortune/2027/sheep']) {
    await page.goto(path)
    await expect.poll(() => page.evaluate(() => typeof (window as unknown as { gtag?: unknown }).gtag)).toBe('function')
  }
  await page.waitForTimeout(1500)
  expect(collect).toEqual([])
})

test('오늘의 운세: 제출·결과 이벤트에 태어난 해가 들어가지 않는다', async ({ page }) => {
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect.poll(async () => (await events(page)).map((e) => e[0])).toEqual(expect.arrayContaining(['fortune_submit', 'result_view']))
  const ev = await events(page)
  expect(JSON.stringify(ev)).not.toContain('1990')
  expect(ev.find((e) => e[0] === 'result_view')![1]).toEqual({ test_name: 'daily', result_id: '말' })
})

test('동물상: 사진 선택·시작·결과·공유 이벤트, 사진 데이터는 없다', async ({ page }) => {
  test.skip(!existsSync('public/dev-faces/person1.jpg'), '개발용 얼굴 없음')
  await page.addInitScript(() => { Object.assign(navigator, { canShare: () => true, share: async () => {} }) })
  await page.goto('/animal')
  await page.locator('input[type=file]').setInputFiles('public/dev-faces/person1.jpg')
  await page.getByRole('radio', { name: '여자' }).click()
  await page.getByRole('button', { name: '동물상 찾기' }).click({ timeout: 30000 })
  await page.getByRole('button', { name: '공유하기' }).click({ timeout: 30000 })
  await expect.poll(async () => (await events(page)).map((e) => e[0])).toEqual(expect.arrayContaining(['photo_selected', 'test_start', 'result_view', 'share_click']))
  const ev = await events(page)
  expect(ev.find((e) => e[0] === 'result_view')![1].result_id).toMatch(/^(dog|cat|fox|bear|rabbit|deer|tiger|eagle)$/)
  expect(ev.find((e) => e[0] === 'share_click')![1]).toEqual({ test_name: 'animal', method: 'link' })
  expect(JSON.stringify(ev)).not.toMatch(/data:image|base64/)
})

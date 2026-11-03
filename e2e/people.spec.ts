import { test, expect, type Page } from '@playwright/test'
import { trackErrors } from './helpers'

// 집계 API는 E2E 서버에서 일부러 503이므로 그 응답만 오류로 세지 않는다.
const realErrors = (errors: string[]) => errors.filter((e) => !e.includes('/api/people/'))

const events = (page: Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]] as [string, Record<string, string>]))

// E2E 서버에는 Supabase 환경 변수가 없다 -> 집계 API는 503, 화면은 숫자를 숨긴다
test('열전 페이지: 로딩, 쿠팡 배너가 닮은꼴 배너보다 위, 펼치면 생애 글', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/people/guanyu')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('관우')
  const coupang = await page.getByText('추천 상품', { exact: true }).first().boundingBox()
  const banner = await page.getByText('나도 관우를 닮았을까').first().boundingBox()
  expect(coupang!.y).toBeLessThan(banner!.y)
  const details = page.locator('details', { hasText: '연의로 보는 생애' })
  await details.locator('summary').click()
  await expect(details.locator('p').first()).toBeVisible()
  const link = page.getByRole('link', { name: /사진 한 장으로 확인하기/ })
  await expect(link).toHaveAttribute('href', '/samguk')
  expect(realErrors(errors)).toEqual([])
})

test('응원 버튼: 숫자 영역 없음, 누르면 people_cheer 이벤트와 고마워요', async ({ page }) => {
  const errors = trackErrors(page)
  const statsResponse = page.waitForResponse((r) => r.url().includes('/api/people/stats'))
  await page.goto('/samguk/people/guanyu')
  const cheer = page.locator('#cheer')
  const btn = cheer.getByRole('button', { name: '응원하기' })
  await expect(btn).toBeVisible()
  // 집계 요청이 끝난 뒤에도 숫자는 없다
  expect((await statsResponse).status()).toBe(503)
  await expect(cheer.locator('[data-cheer-count]')).toHaveCount(0)
  await btn.click()
  await expect(cheer.getByRole('button')).toHaveText('고마워요')
  await expect(cheer.locator('[data-cheer-count]')).toHaveCount(0)
  await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'people_cheer')).toEqual([['people_cheer', { result_id: 'guanyu' }]])
  expect(realErrors(errors)).toEqual([])
})

test('투표: 투표 전 % 없음, 누르면 people_vote 이벤트와 선택 표시, 비율은 숨김', async ({ page }) => {
  await page.goto('/samguk/people/guanyu')
  const duel = page.locator('#duel-vote')
  await expect(duel.getByRole('heading')).toHaveText('관우 vs 조조, 일기토하면 누가 이길까?')
  await expect(duel).not.toContainText('%')
  await duel.getByRole('button', { name: '관우' }).click()
  await expect(duel.getByRole('button', { name: '관우' })).toHaveAttribute('aria-pressed', 'true')
  await expect(duel).not.toContainText('%')
  await expect(duel.getByRole('button', { name: '친구에게 공유하기' })).toBeVisible()
  await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'people_vote')).toEqual([['people_vote', { result_id: 'duel_guanyu' }]])
})

test('허브: 열전 링크를 눌러 열전으로 이동하고, 순위 링크가 있다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/people')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('삼국지 인물 관계도')
  await expect(page.getByRole('link', { name: '가장 응원받는 장수 순위 보기' })).toHaveAttribute('href', '/samguk/people/ranking')
  // 첫 세력(위나라)만 펼쳐져 있으니 촉나라를 펼친 뒤 관우 카드를 누른다
  await page.locator('summary', { hasText: '촉나라' }).click()
  await page.locator('main li a[href="/samguk/people/guanyu"]').first().click()
  await expect(page).toHaveURL(/\/samguk\/people\/guanyu$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('관우')
  expect(realErrors(errors)).toEqual([])
})

test('순위: 집계가 없으면 응원을 모으는 중과 열전 링크', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/people/ranking')
  await expect(page.getByText('응원을 모으는 중', { exact: true })).toBeVisible()
  await page.locator('main a[href="/samguk/people/guanyu"]').click()
  await expect(page).toHaveURL(/\/samguk\/people\/guanyu$/)
  expect(realErrors(errors)).toEqual([])
})

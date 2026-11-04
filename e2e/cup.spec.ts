import { test, expect, type Page } from '@playwright/test'
import { trackErrors } from './helpers'

// E2E 서버에는 Supabase 환경 변수가 없다 -> /api/people/cup 은 503, 화면은 비율 숫자를 숨기고 실패 문구를 보인다.
const realErrors = (errors: string[]) => errors.filter((e) => !e.includes('/api/people/'))

const events = (page: Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]] as [string, Record<string, string>]))

const FAIL_COPY = '지금은 다른 사람 선택을 불러오지 못했어요'
const cards = (page: Page) => page.getByTestId('cup-card')
const nextButton = (page: Page) => page.getByRole('button', { name: /^(다음 대결|결과 보기)$/ })

// 왼쪽 카드를 골라 비율 칸의 실패 문구를 확인하고 다음으로 넘어간다. 마지막 대결은 버튼 이름이 '결과 보기'다.
async function playMatches(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await expect(cards(page)).toHaveCount(2)
    await cards(page).first().click()
    await expect(page.getByTestId('ratio')).toHaveText(FAIL_COPY)
    // 마지막 대결만 버튼이 '결과 보기', 그 전은 '다음 대결'
    await expect(nextButton(page)).toHaveText(i === count - 1 ? '결과 보기' : '다음 대결')
    await nextButton(page).click()
  }
}

test('판 고르기: 판 카드 4개, 집계가 없으면 판 수 문구 없음, 최강 무장을 누르면 그 판으로', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/cup')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('누가 나의 최애 장수일까요?')
  const boardCards = page.locator('main ul a[href^="/samguk/cup/"]')
  await expect(boardCards).toHaveCount(4)
  await expect(page.locator('body')).not.toContainText('지금까지')
  await boardCards.filter({ hasText: '최강 무장' }).click()
  await expect(page).toHaveURL(/\/samguk\/cup\/warrior$/)
  await expect(page.getByText('둘 중 누가 더 끌리나요?')).toBeVisible()
  expect(realErrors(errors)).toEqual([])
})

test('최강 무장 한 판: 15번 고르면 끝 화면, 열전 링크, cup_start/cup_end', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/cup/warrior')
  await expect(page.getByText('최강 무장 16강 · 1/8')).toBeVisible()
  await expect(page.getByText('둘 중 누가 더 끌리나요?')).toBeVisible()
  await expect(nextButton(page)).toBeDisabled()
  await playMatches(page, 15)
  await expect(page.getByRole('heading', { name: '나의 최애 장수' })).toBeVisible()
  await expect(page.getByRole('link', { name: /열전 보기$/ })).toHaveAttribute('href', /^\/samguk\/people\/[a-z]+$/)
  await expect(page.getByRole('link', { name: '다른 판 하기' })).toHaveAttribute('href', '/samguk/cup')
  const ev = await events(page)
  expect(ev.filter((e) => e[0] === 'cup_start')).toEqual([['cup_start', { result_id: 'warrior' }]])
  const ends = ev.filter((e) => e[0] === 'cup_end')
  expect(ends).toHaveLength(1)
  expect(ends[0][1].result_id).toMatch(/^warrior_[a-z]+$/)
  expect(ends[0][1].result_id.length).toBeLessThanOrEqual(24)
  expect(realErrors(errors)).toEqual([])
})

test('같은 대결에서 카드를 세 번 눌러도 저장 요청은 한 번', async ({ page }) => {
  const posts: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/people/cup')) posts.push(r.method())
  })
  await page.goto('/samguk/cup/warrior')
  await expect(cards(page)).toHaveCount(2)
  await cards(page).first().click()
  await cards(page).last().click()
  await cards(page).first().click()
  await expect(page.getByTestId('ratio')).toHaveText(FAIL_COPY)
  expect(posts).toEqual(['POST'])
})

test('삼국지 여인 판: 8강 1/4로 시작해 7번 뒤 끝 화면', async ({ page }) => {
  await page.goto('/samguk/cup/women')
  await expect(page.getByText('삼국지 여인 8강 · 1/4')).toBeVisible()
  await playMatches(page, 7)
  await expect(page.getByRole('heading', { name: '나의 최애 장수' })).toBeVisible()
  await expect(page.getByRole('link', { name: /열전 보기$/ })).toBeVisible()
})

test('무작위 판 ?with=guanyu: 첫 라운드 안에 관우 카드가 나온다', async ({ page }) => {
  await page.goto('/samguk/cup/random?with=guanyu')
  await expect(page.getByText('전체 무작위 16강 · 1/8')).toBeVisible()
  let seen = false
  for (let i = 0; i < 8 && !seen; i++) {
    await expect(cards(page)).toHaveCount(2)
    if ((await page.locator('[data-card-id="guanyu"]').count()) > 0) {
      seen = true
      break
    }
    await cards(page).first().click()
    await expect(page.getByTestId('ratio')).toHaveText(FAIL_COPY)
    await nextButton(page).click()
  }
  expect(seen).toBe(true)
})

test('공유 착지: 나도 해보기와 noindex, 후보가 아닌 조합은 월드컵 첫 화면으로', async ({ page }) => {
  await page.goto('/samguk/cup/r/warrior/lvbu')
  await expect(page.getByRole('link', { name: '나도 해보기' })).toHaveAttribute('href', '/samguk/cup/warrior')
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
  await page.goto('/samguk/cup/r/warrior/zhugeliang')
  await expect(page).toHaveURL(/\/samguk\/cup$/)
})

test('375px: 가로 스크롤 없음, 카드 버튼 44px 이상', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/samguk/cup/warrior')
  await expect(cards(page)).toHaveCount(2)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  for (const card of await cards(page).all()) {
    const box = await card.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  await cards(page).first().click()
  await expect(page.getByTestId('ratio')).toHaveText(FAIL_COPY)
  const after = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(after).toBeLessThanOrEqual(0)
})

test('열전 → 월드컵: 이 장수로 월드컵 하기 링크', async ({ page }) => {
  await page.goto('/samguk/people/lvbu')
  await expect(page.getByRole('link', { name: '이 장수로 월드컵 하기' })).toHaveAttribute('href', '/samguk/cup/warrior?with=lvbu')
})

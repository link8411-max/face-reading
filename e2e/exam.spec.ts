import { test, expect, type Page } from '@playwright/test'
import { trackErrors } from './helpers'

const events = (page: Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]] as [string, Record<string, string>]))

// 문제 화면의 보기 버튼(해설이 나오면 사라진다)
const options = (page: Page) => page.locator('section[aria-label="문제"] ul button')

/** 다섯 문제를 모두 첫 보기로 푼다. */
async function playFirstOptions(page: Page) {
  await page.getByRole('button', { name: '시험 시작' }).click()
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`${i} / 5`)).toBeVisible()
    await options(page).first().click()
    await expect(page.getByRole('region', { name: '해설' })).toBeVisible()
    await expect(page.getByText('이런 말이에요')).toBeVisible()
    await page.getByRole('button', { name: i === 5 ? '성적표 보기' : '다음 문제' }).click()
  }
}

test('/exam은 /exam/meme으로 넘어간다', async ({ page }) => {
  await page.goto('/exam')
  await expect(page).toHaveURL(/\/exam\/meme$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('밈 능력고사')
})

test('한 판: 시작 → 5문제 → 성적표, 새로 고침하면 성적표가 바로 보인다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/exam/meme')
  await expect(page.getByText('5문제, 1분이면 끝나요')).toBeVisible()
  await playFirstOptions(page)
  await page.getByRole('button', { name: '건너뛰기' }).click()
  await expect(page.getByText('밈 능력고사 성적통지표')).toBeVisible()
  await expect(page.getByText(/^[1-9]등급$/)).toBeVisible()
  await expect(page.getByText('내일 문제는 자정에 열려요')).toBeVisible()
  const ev = await events(page)
  expect(ev.filter((e) => e[0] === 'exam_start')).toEqual([['exam_start', { test_name: 'exam', result_id: 'meme' }]])
  const ends = ev.filter((e) => e[0] === 'exam_end')
  expect(ends).toHaveLength(1)
  expect(ends[0][1].result_id).toMatch(/^meme_g[1-9]$/)
  await page.reload()
  await expect(page.getByText('밈 능력고사 성적통지표')).toBeVisible()
  await expect(page.getByRole('button', { name: '시험 시작' })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('채점 연출은 기다려도 성적표로 넘어간다', async ({ page }) => {
  await page.goto('/exam/meme')
  await playFirstOptions(page)
  await expect(page.getByText('채점 중이에요')).toBeVisible()
  await expect(page.getByText('밈 능력고사 성적통지표')).toBeVisible({ timeout: 6000 })
})

test('시간이 지나면 오답 처리되고 해설이 나온다', async ({ page }) => {
  await page.goto('/exam/meme')
  await page.getByRole('button', { name: '시험 시작' }).click()
  await expect(page.getByText('아쉬워요')).toBeVisible({ timeout: 13_000 })
  await expect(page.getByText('시간이 지났어요')).toBeVisible()
})

test('375px: 가로 스크롤 없음, 보기 버튼 44px 이상', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/exam/meme')
  await page.getByRole('button', { name: '시험 시작' }).click()
  await expect(options(page).first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  for (const b of await options(page).all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await expect(page.getByRole('button', { name: '힌트 쓰기' })).toBeVisible()
})

test('도전장 링크: 친구 등급이 보이고, 다 풀면 친구·나 두 줄과 결과, noindex', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/exam/meme/r/1-OXOOX-345-5')
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://unse-ai.com/exam/meme')
  await expect(page.getByText('친구는 5등급. 이길 수 있어요?')).toBeVisible()
  await expect(page.getByText(/^1회차/)).toBeVisible()
  await playFirstOptions(page)
  await page.getByRole('button', { name: '건너뛰기' }).click()
  const duel = page.getByRole('region', { name: '친구와 대결' })
  await expect(duel).toBeVisible()
  await expect(duel.getByText('친구', { exact: true })).toBeVisible()
  await expect(duel.getByText('나', { exact: true })).toBeVisible()
  await expect(duel.getByText(/^(이겼어요|졌어요|비겼어요)$/)).toBeVisible()
  await expect(page.getByRole('button', { name: '나도 도전장 보내기' })).toBeVisible()
  const ev = await events(page)
  expect(ev).toContainEqual(['shared_landing', { test_name: 'exam', result_id: 'meme' }])
  expect(errors).toEqual([])
})

test('손으로 고친 도전장 링크는 일반 시작 화면이 된다', async ({ page }) => {
  const errors = trackErrors(page)
  for (const code of ['zzz', '999-OOOOO-9999-0', '1-OXOO-300-5', '9999-OXOOX-345-5']) {
    const res = await page.goto(`/exam/meme/r/${code}`)
    expect(res?.status(), code).toBeLessThan(400)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('밈 능력고사')
    await expect(page.getByRole('button', { name: '시험 시작' })).toBeVisible()
    await expect(page.getByText(/친구는/)).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('미리보기 이미지: 등급·맞힌 수만 받는다', async ({ request }) => {
  const ok = await request.get('/api/og/result?kind=exam&grade=3&correct=4')
  expect(ok.status()).toBe(200)
  expect(ok.headers()['content-type']).toContain('image/png')
  expect((await request.get('/api/og/result?kind=exam&grade=10&correct=4')).status()).toBe(400)
  expect((await request.get('/api/og/result?kind=exam&grade=3&correct=4&x=1')).status()).toBe(400)
})

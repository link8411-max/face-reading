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

test('응원 버튼: 기록이 꺼져 있으면 숫자·순위 없음, 누르면 people_cheer 이벤트와 고마워요', async ({ page }) => {
  const errors = trackErrors(page)
  const statsResponse = page.waitForResponse((r) => r.url().includes('/api/people/stats'))
  await page.goto('/samguk/people/guanyu')
  const cheer = page.locator('#cheer')
  const btn = cheer.getByRole('button', { name: '응원하기' })
  await expect(btn).toBeVisible()
  // 집계 요청이 끝난 뒤에도 숫자는 없다
  expect((await statsResponse).status()).toBe(503)
  await expect(cheer.locator('[data-cheer-count]')).toHaveCount(0)
  await expect(cheer.locator('[data-cheer-rank]')).toHaveCount(0)
  await expect(cheer.getByRole('link', { name: '응원 순위 보기' })).toHaveAttribute('href', '/samguk/people/ranking')
  await btn.click()
  await expect(cheer.getByRole('button')).toHaveText('고마워요')
  await expect(cheer.locator('[data-cheer-count]')).toHaveCount(0)
  await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'people_cheer')).toEqual([['people_cheer', { result_id: 'guanyu' }]])
  expect(realErrors(errors)).toEqual([])
})

test('투표: 투표 전 % 없음, 누르면 people_vote 이벤트와 선택 표시, 비율은 숨김', async ({ page }) => {
  await page.goto('/samguk/people/guanyu')
  const duel = page.locator('#duel-vote')
  await expect(duel.getByRole('heading')).toHaveText('관우 vs 여포, 일기토하면 누가 이길까?')
  await expect(duel).not.toContainText('%')
  await duel.getByRole('button', { name: '관우' }).click()
  await expect(duel.getByRole('button', { name: '관우' })).toHaveAttribute('aria-pressed', 'true')
  await expect(duel).not.toContainText('%')
  await expect(duel.getByRole('button', { name: '친구에게 공유하기' })).toBeVisible()
  await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'people_vote')).toEqual([['people_vote', { result_id: 'duel_guanyu' }]])
})

const card = (page: Page, id: string) => page.locator(`#people-list li[data-person="${id}"]`)

test('허브: 처음엔 삼국 지도와 전체 인기 12명, 펼친 details 없음, 카드를 눌러 열전으로', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/people')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('천하를 눌러 영웅을 만나 보세요')
  await expect(page.getByRole('group', { name: '삼국 개략도' })).toBeVisible()
  await expect(page.getByText('개략도예요. 실제 국경과 다를 수 있어요')).toBeVisible()
  await expect(page.locator('details[open]')).toHaveCount(0)
  await expect(page.locator('#people-list li:visible')).toHaveCount(12)
  await expect(card(page, 'caocao')).toBeVisible()
  await expect(card(page, 'liubei')).toBeVisible()
  await expect(page.getByRole('link', { name: /응원 순위/ })).toHaveAttribute('href', '/samguk/people/ranking')
  await card(page, 'guanyu').locator('a').click()
  await expect(page).toHaveURL(/\/samguk\/people\/guanyu$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('관우')
  expect(realErrors(errors)).toEqual([])
})

test('허브: 세력 버튼과 지도로 인물 목록이 바뀌고, 더 보기로 나머지가 나온다', async ({ page }) => {
  await page.goto('/samguk/people')
  await page.getByRole('button', { name: /^촉 \d+/ }).click()
  await expect(card(page, 'liubei')).toBeVisible()
  await expect(card(page, 'caocao')).toBeHidden()
  // 지도에서 오나라를 누르면 오 인물만
  await page.getByRole('button', { name: '오나라 인물 보기' }).click()
  await expect(card(page, 'sunquan')).toBeVisible()
  await expect(card(page, 'liubei')).toBeHidden()
  // 같은 곳을 다시 누르면 전체로
  await page.getByRole('button', { name: '오나라 인물 보기' }).click()
  await expect(page.locator('#people-list li:visible')).toHaveCount(12)
  // 군웅 칩
  await page.getByRole('button', { name: '군웅 인물 보기' }).click()
  await expect(card(page, 'lvbu')).toBeVisible()
  // 더 보기: 전체에서 12명 밖 인물이 나온다
  await page.getByRole('button', { name: /^전체 \d+/ }).click()
  await expect(card(page, 'fazheng')).toBeHidden()
  await page.getByRole('button', { name: /^더 보기/ }).click()
  await expect(card(page, 'fazheng')).toBeVisible()
  await expect(page.getByRole('button', { name: /^더 보기/ })).toHaveCount(0)
})

test('허브: 이름 검색(자 포함)과 결과 없음 안내', async ({ page }) => {
  await page.goto('/samguk/people')
  const box = page.getByRole('searchbox', { name: '인물 이름 검색' })
  await box.fill('하후')
  await expect(card(page, 'xiaohoudun')).toBeVisible()
  await expect(card(page, 'xiahouyuan')).toBeVisible()
  await expect(card(page, 'caocao')).toBeHidden()
  // 촉을 골라 둬도 검색은 전체에서: 하후돈이 나오고, 지우면 촉 목록으로 돌아간다
  await page.getByRole('button', { name: /^촉 \d+/ }).click()
  await box.fill('하후')
  await expect(page.getByRole('heading', { name: '검색 결과' })).toBeVisible()
  await expect(card(page, 'xiaohoudun')).toBeVisible()
  await expect(card(page, 'liubei')).toBeHidden()
  await box.fill('')
  await expect(card(page, 'liubei')).toBeVisible()
  await expect(card(page, 'xiaohoudun')).toBeHidden()
  await page.getByRole('button', { name: /^전체 \d+/ }).click()
  await box.fill('운장')
  await expect(card(page, 'guanyu')).toBeVisible()
  await box.fill('없는사람이름')
  await expect(page.getByText('찾는 인물이 아직 없어요')).toBeVisible()
  await expect(page.locator('#people-list li:visible')).toHaveCount(0)
  await box.fill('')
  await expect(page.locator('#people-list li:visible')).toHaveCount(12)
})

test('허브: 오늘의 인물 카드와 열전 링크, 관계도 바로가기는 닫힌 세력 목록으로', async ({ page }) => {
  await page.goto('/samguk/people')
  const today = page.getByRole('region', { name: '오늘의 인물' })
  await expect(today.getByText('알고 보면')).toBeVisible()
  await expect(today.getByRole('link', { name: /열전 읽기$/ })).toHaveAttribute('href', /^\/samguk\/people\/[a-z]+$/)
  await page.getByRole('link', { name: /관계도 보기/ }).click()
  await expect(page).toHaveURL(/#relations$/)
  await expect(page.getByRole('heading', { name: '세력별 관계도' })).toBeInViewport()
  await expect(page.locator('details[open]')).toHaveCount(0)
  // 세력을 펼치면 기존 관계도 인물 링크가 보인다
  await page.locator('summary', { hasText: '촉나라' }).click()
  await expect(page.locator('#relations li a[href="/samguk/people/guanyu"]').first()).toBeVisible()
})

test('허브: 누르는 곳은 44px 이상이고, 지도를 누르면 목록 제목이 보이는 곳으로 내려간다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/samguk/people')
  const sizes = async (loc: ReturnType<Page['locator']>) => (await loc.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))).map(Math.round)
  expect((await sizes(page.getByRole('group', { name: '세력 고르기' }).getByRole('button'))).every((h) => h >= 44)).toBe(true)
  // 군웅 칩은 지도 위 투명 확장 영역까지 포함해 44px 이상(화면 높이 기준)
  const chip = await page.evaluate(() => {
    const svg = document.querySelector('svg[aria-label="삼국 개략도"]')!
    const rect = svg.querySelector('g[aria-label="군웅 인물 보기"] rect')!
    return rect.getBoundingClientRect().height
  })
  expect(chip).toBeGreaterThanOrEqual(44)
  const heading = page.locator('#people-list h2')
  expect(await heading.evaluate((h) => h.getBoundingClientRect().top)).toBeGreaterThan(667 - 140)
  await page.getByRole('button', { name: '촉나라 인물 보기' }).click()
  await expect(heading).toBeInViewport()
  await expect(heading).toHaveText('촉나라 인물')
})

test('허브 375px: 가로 스크롤이 없다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/samguk/people')
  await expect(page.getByRole('group', { name: '삼국 개략도' })).toBeVisible()
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over).toBeLessThanOrEqual(0)
  // 지도 안 글자는 화면에서 11px 이상
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('svg[aria-label="삼국 개략도"] text')].filter((el) => el.getBoundingClientRect().height < 10 || parseFloat(getComputedStyle(el).fontSize) * (el.ownerSVGElement!.getBoundingClientRect().width / 360) < 11).length,
  )
  expect(small).toBe(0)
})

test('순위: 집계가 없으면 응원을 모으는 중과 열전 링크', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/people/ranking')
  await expect(page.getByText('응원을 모으는 중', { exact: true })).toBeVisible()
  // 세력별 목록은 닫혀 있다
  await expect(page.locator('main a[href="/samguk/people/guanyu"]')).toBeHidden()
  await page.locator('summary', { hasText: '촉나라' }).click()
  await page.locator('main a[href="/samguk/people/guanyu"]').click()
  await expect(page).toHaveURL(/\/samguk\/people\/guanyu$/)
  expect(realErrors(errors)).toEqual([])
})

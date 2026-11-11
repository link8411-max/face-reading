import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

test('관상 히어로 → 관상, 시즌 카드(수능 뒤) → 내 사주 풀이', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00+09:00'))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /내 얼굴에는/ })).toBeVisible()
  await page.getByRole('link', { name: '내 관상 보러 가기' }).click()
  await expect(page).toHaveURL(/\/face2$/)
  await page.goto('/')
  await page.getByRole('link', { name: /내 사주 보기/ }).click()
  await expect(page).toHaveURL(/\/saju$/)
})

test('띠 바로 고르기: 양띠를 누르면 오늘의 운세가 메인에 나오고 두 링크로 이어진다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  const picker = page.getByRole('region', { name: '띠 바로 고르기' })
  await picker.getByRole('button', { name: /양/ }).click()
  await expect(picker.getByText(/양띠 오늘의 한마디/)).toBeVisible()
  await expect(picker.getByRole('link', { name: /오늘의 운세 자세히/ })).toHaveAttribute('href', '/fortune/daily')
  await expect(picker.getByRole('link', { name: /2027 양띠 운세/ })).toHaveAttribute('href', '/fortune/2027/sheep')
  expect(errors).toEqual([])
})

test('묶음 탭 전환: 사주·운세를 누르면 운세 항목이 보인다', async ({ page }) => {
  await page.goto('/')
  const tabs = page.getByRole('region', { name: '테스트 묶음' })
  await expect(tabs.locator('a[href="/samguk"]')).toBeVisible()
  await tabs.getByRole('tab', { name: '사주·운세' }).click()
  await expect(tabs.locator('a[href="/fortune/daily"]')).toBeVisible()
  await tabs.getByRole('tab', { name: '궁합' }).click()
  await expect(tabs.locator('a[href="/mbti/match"]')).toBeVisible()
})

test('홈에서 6개 테스트에 두 번 탭 이내로 도달', async ({ page }) => {
  const reach = async (href: string) => {
    await page.goto('/')
    const direct = page.locator(`main a[href="${href}"]:visible`).first()
    if (await direct.count()) { await direct.click() } else {
      await page.getByRole('region', { name: '테스트 묶음' }).getByRole('tab', { name: '사주·운세' }).click()
      await page.locator(`main a[href="${href}"]:visible`).first().click()
    }
    await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, '\\/')}$`))
  }
  for (const href of ['/samguk', '/animal', '/face2', '/fortune', '/fortune/2027', '/fortune/daily']) await reach(href)
})

test('홈: hydration 오류 없음', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await page.waitForTimeout(800)
  expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([])
})

test('홈 순서: 히어로 → 시즌 카드 → 띠 고르기 → 친구랑 같이 → 쿠팡 배너 → 묶음 탭 (배너가 첫 흐름을 막지 않는다)', async ({ page }) => {
  await page.goto('/')
  const y = async (loc: import('@playwright/test').Locator) => (await loc.boundingBox())!.y
  const hero = await y(page.getByRole('region', { name: /내 얼굴에는/ }))
  const season = await y(page.locator('section[aria-label^="수능"], section[aria-label="내 사주 풀이"]'))
  const picker = await y(page.getByRole('region', { name: '띠 바로 고르기' }))
  const together = await y(page.getByRole('region', { name: '친구랑 같이 해봐요' }))
  const banner = await y(page.locator('iframe[title="쿠팡 추천 상품"]'))
  const tabs = await y(page.getByRole('region', { name: '테스트 묶음' }))
  expect(hero).toBeLessThan(season)
  expect(season).toBeLessThan(picker)
  expect(picker).toBeLessThan(together)
  expect(together).toBeLessThan(banner)
  expect(banner).toBeLessThan(tabs)
})

test('밈 능력고사: 홈 카드와 푸터에서 /exam/meme으로 간다', async ({ page }) => {
  await page.goto('/')
  const card = page.getByRole('region', { name: '친구랑 같이 해봐요' }).locator('a[href="/exam/meme"]')
  await expect(card).toHaveCount(1)
  await expect(card).toContainText('밈 능력고사')
  await expect(card).toContainText('매일 5문제, 내 등급은?')
  await expect(page.locator('footer a[href="/exam/meme"]')).toHaveCount(1)
  await card.click()
  await expect(page).toHaveURL(/\/exam\/meme$/)
})

test('시즌 카드(11/12): 수능 D-7 합격 부적 카드 → /bujeok?mode=gift&wish=pass, 선물·합격이 미리 골라져 있다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T10:00:00+09:00'))
  await page.goto('/')
  const card = page.getByRole('region', { name: '수능 D-7' })
  await expect(card).toContainText('수험생에게')
  await expect(card).toContainText('이름 도장 찍힌 부적 카드, 카톡으로 선물')
  await card.getByRole('link', { name: '합격 부적 보내기' }).click()
  await expect(page).toHaveURL(/\/bujeok\?mode=gift&wish=pass$/)
  await expect(page.getByRole('radio', { name: '선물 보내기' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: '합격' })).toHaveAttribute('aria-checked', 'true')
})

test('시즌 카드: 수능 당일 D-DAY, 11/20 수고했어요, 11/21은 사주 카드', async ({ page }) => {
  for (const [d, label] of [['2026-11-19', '수능 D-DAY'], ['2026-11-20', '수능 수고했어요'], ['2026-11-21', '내 사주 풀이']] as const) {
    await page.clock.setFixedTime(new Date(`${d}T09:00:00+09:00`))
    await page.goto('/')
    await expect(page.getByRole('region', { name: label })).toBeVisible()
  }
})

test('시즌 카드가 바뀌어도(사주 → 수능) 카드 높이가 같아 아래 칸이 밀리지 않는다', async ({ page }) => {
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 })
    await page.clock.setFixedTime(new Date('2026-11-25T09:00:00+09:00'))
    await page.goto('/')
    const saju = await page.getByRole('region', { name: '내 사주 풀이' }).evaluate((e) => e.getBoundingClientRect().height)
    await page.clock.setFixedTime(new Date('2026-11-12T09:00:00+09:00'))
    await page.goto('/')
    const suneung = await page.getByRole('region', { name: '수능 D-7' }).evaluate((e) => e.getBoundingClientRect().height)
    expect(Math.abs(saju - suneung), `${width}px`).toBeLessThanOrEqual(2)
  }
})

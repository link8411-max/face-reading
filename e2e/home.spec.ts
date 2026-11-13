import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

test('관상 히어로 → 관상, 시즌 카드(수능 뒤) → 내 사주 풀이', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00+09:00'))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '저승사자의 명부 사주' })).toBeVisible()
  await page.getByRole('link', { name: /내 관상 보러 가기/ }).click()
  await expect(page).toHaveURL(/\/face2$/)
  await page.goto('/')
  await page.getByRole('link', { name: /내 사주 보기/ }).click()
  await expect(page).toHaveURL(/\/saju$/)
})

test('칩 "운세"를 누르면 운세 카드만 보이고 다른 카드는 숨는다', async ({ page }) => {
  await page.goto('/')
  const card = (href: string) => page.locator(`[data-home-card="${href}"]`)
  await expect(card('/samguk')).toBeVisible()
  await expect(card('/fortune/2027')).toBeHidden()
  const chip = page.getByRole('button', { name: '운세', exact: true })
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await expect(card('/fortune/2027')).toBeVisible()
  await expect(card('/fortune/daily')).toBeVisible()
  await expect(card('/samguk')).toBeHidden()
  await expect(card('/face-match')).toBeHidden()
  await page.getByRole('button', { name: '전체', exact: true }).click()
  await expect(card('/samguk')).toBeVisible()
})

test('서버 HTML에는 숨겨진 카드까지 모든 링크가 있다', async ({ request }) => {
  const html = await (await request.get('/')).text()
  for (const href of ['/fortune/2027', '/samguk/cup', '/mbti', '/samguk/duel', '/exam/meme']) expect(html, href).toContain(`href="${href}"`)
})

test('홈에서 6개 테스트에 두 번 탭 이내로 도달', async ({ page }) => {
  const reach = async (href: string) => {
    await page.goto('/')
    const direct = page.locator(`main a[href="${href}"]:visible`).first()
    if (await direct.count()) { await direct.click() } else {
      await page.getByRole('button', { name: '운세', exact: true }).click()
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

test('홈 순서: 칩 → 대표 카드 → 시즌 띠 → 카드 2열 → 오늘 줄 → 쿠팡 배너 → FAQ', async ({ page }) => {
  await page.goto('/')
  const y = async (loc: import('@playwright/test').Locator) => (await loc.boundingBox())!.y
  const chips = await y(page.getByRole('button', { name: '전체', exact: true }))
  const hero = await y(page.getByRole('region', { name: '오늘의 추천' }))
  const season = await y(page.locator('section[aria-label^="수능"], section[aria-label="내 사주 풀이"]'))
  const grid = await y(page.getByRole('list', { name: '테스트 카드' }))
  const today = await y(page.getByRole('region', { name: '오늘 새로 바뀐 것' }))
  const banner = await y(page.locator('iframe[title="쿠팡 추천 상품"]'))
  const faq = await y(page.getByRole('region', { name: '자주 묻는 질문' }))
  const order = [chips, hero, season, grid, today, banner, faq]
  expect(order).toEqual([...order].sort((a, b) => a - b))
})

test('캐러셀: 여섯 장, 옆으로 넘기면 표시가 2 / 6, 320px에서도 넘치지 않는다', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 }); await page.goto('/')
    await expect(page.locator('[data-hero-slide]')).toHaveCount(6)
    await expect(page.locator('[data-hero-count]')).toHaveText('1 / 6')
    await page.locator('[data-hero-scroller]').evaluate((e) => { e.scrollTo({ left: e.clientWidth, behavior: 'instant' as ScrollBehavior }) })
    await expect(page.locator('[data-hero-count]')).toHaveText('2 / 6')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${width}px`).toBe(false)
  }
})

test('띠 바로 고르기는 오늘 탭으로 옮겨졌다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/today')
  const picker = page.getByRole('region', { name: '띠 바로 고르기' })
  await picker.getByRole('button', { name: /양/ }).click()
  await expect(picker.getByText(/양띠 오늘의 한마디/)).toBeVisible()
  await expect(picker.getByRole('link', { name: /2027 양띠 운세/ })).toHaveAttribute('href', '/fortune/2027/sheep')
  expect(errors).toEqual([])
  await page.goto('/')
  await expect(page.getByRole('region', { name: '띠 바로 고르기' })).toHaveCount(0)
})

test('390px 홈 본문 높이 3000px 이하(푸터 제외, 큰 캐릭터 카드 때문에 2600에서 올림)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/')
  const h = await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().height)
  console.log('HOME_MAIN_HEIGHT', h)
  expect(h).toBeLessThanOrEqual(3000)
})

test('검색으로 테스트 시작 화면에 들어와도 다른 테스트로 가는 줄이 있다', async ({ page }) => {
  await page.goto('/animal')
  await expect(page.getByRole('heading', { name: '다른 테스트 둘러보기' })).toBeVisible()
  await expect(page.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/all')
})

for (const width of [320, 390]) {
  test(`${width}px: 홈이 가로로 넘치지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 }); await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  })
}

test('밈 능력고사: 홈 카드와 푸터에서 /exam/meme으로 간다', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('[data-home-card="/exam/meme"] a')
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
  await expect(page.getByRole('radio', { name: '선물하기' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: '합격' })).toHaveAttribute('aria-pressed', 'true') // 소원은 aria-pressed 버튼
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

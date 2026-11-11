import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

const CASES: [string, string][] = [['/', '홈'], ['/face2', '관상'], ['/samguk', '관상'], ['/fortune', '사주·운세'], ['/fortune/daily', '사주·운세'], ['/fortune/2027/sheep', '사주·운세'], ['/about', '홈'], ['/bujeok', '부적'], ['/bujeok/box', '부적']]

for (const [path, label] of CASES) {
  test(`${path}: 하단 탭바가 있고 "${label}" 탭이 현재 탭`, async ({ page }) => {
    await page.goto(path)
    const bar = page.getByRole('navigation', { name: '하단 메뉴' })
    await expect(bar).toBeVisible()
    await expect(bar.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })
}

test('탭을 눌러 묶음 페이지로 이동', async ({ page }) => {
  await page.goto('/')
  const bar = page.getByRole('navigation', { name: '하단 메뉴' })
  for (const [label, url] of [['관상', /\/face-tests$/], ['사주·운세', /\/unse$/], ['부적', /\/bujeok$/], ['궁합', /\/mbti$/], ['홈', /3200\/$/]] as const) {
    await bar.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(url)
  }
})

test('결과 화면 맨 아래 버튼·배너가 탭바에 가리지 않는다', async ({ page }) => {
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const barTop = (await page.getByRole('navigation', { name: '하단 메뉴' }).boundingBox())!.y
  const footer = page.locator('footer')
  const footerBottom = await footer.evaluate((el) => el.getBoundingClientRect().bottom)
  expect(footerBottom).toBeLessThanOrEqual(barTop + 2) // 소수점 렌더링 오차 허용
})

test('삼국지 결과 저장 이미지에 탭바가 섞이지 않는다(no-screenshot)', async ({ page }) => {
  test.skip(!existsSync('public/dev-faces/person1.jpg'), '개발용 얼굴 없음')
  await page.goto('/samguk')
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveClass(/no-screenshot/)
})

for (const width of [320, 390]) {
  test(`${width}px: 탭 5개가 한 줄에 들어가고 글자가 잘리지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const bar = page.getByRole('navigation', { name: '하단 메뉴' })
    await expect(bar).toBeVisible()
    const m = await bar.evaluate((nav) => {
      const links = [...nav.querySelectorAll('a')]
      return {
        navW: nav.getBoundingClientRect().width,
        scrollW: nav.scrollWidth,
        docOverflow: document.documentElement.scrollWidth > window.innerWidth,
        items: links.map((a) => {
          const r = a.getBoundingClientRect()
          const label = [...a.childNodes].find((n) => n.nodeType === 3) as Text
          const range = document.createRange()
          range.selectNodeContents(label)
          const lr = range.getBoundingClientRect()
          return { top: Math.round(r.top), w: r.width, textW: lr.width, textH: lr.height, scrollW: a.scrollWidth, clientW: a.clientWidth }
        }),
      }
    })
    expect(m.items).toHaveLength(5)
    expect(new Set(m.items.map((i) => i.top)).size).toBe(1) // 한 줄
    expect(m.scrollW).toBeLessThanOrEqual(m.navW + 1)
    expect(m.docOverflow).toBe(false)
    for (const i of m.items) {
      expect(i.textW).toBeLessThanOrEqual(i.w) // 글자가 칸보다 넓지 않다
      expect(i.textH).toBeLessThan(20) // 한 줄 높이(줄바꿈 없음)
      expect(i.scrollW).toBeLessThanOrEqual(i.clientW)
    }
    await page.screenshot({ path: `test-results/tabbar-${width}.png`, clip: { x: 0, y: 700, width, height: 100 } })
  })
}

import { test, expect } from '@playwright/test'

const HANGUL = /[가-힣]/

test('한국어 페이지의 <html lang>은 ko', async ({ page }) => {
  for (const p of ['/', '/face2', '/saju']) {
    await page.goto(p)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
  }
})

test('/en 아래 페이지의 <html lang>은 en', async ({ page }) => {
  for (const p of ['/en', '/en/all', '/en/face2', '/en/animal', '/en/face-match']) {
    await page.goto(p)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  }
})

for (const p of ['/en', '/en/all', '/en/face2', '/en/animal', '/en/face-match']) {
  test(`${p}: 영어 제목, canonical, hreflang, 한글 없음`, async ({ page }) => {
    await page.goto(p)
    await expect(page).toHaveTitle(/unse-ai\.com/)
    expect(await page.title()).not.toMatch(HANGUL)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://unse-ai.com${p}`)
    const ko = p === '/en' ? 'https://unse-ai.com' : `https://unse-ai.com${p.slice(3)}`
    await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute('href', ko)
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', ko)
    // 본문(화면에 보이는 글자)에 한글이 없다
    const text = await page.evaluate(() => document.body.innerText)
    expect(text.match(HANGUL)?.join('') ?? '', `${p} 본문의 한글`).toBe('')
    // 카카오·쿠팡·부적 선물은 영어판에 없다
    await expect(page.getByText('부적')).toHaveCount(0)
    await expect(page.locator('a[href^="/bujeok"]')).toHaveCount(0)
  })
}

test('한국어 페이지에 영어 hreflang이 걸려 있고 canonical은 그대로', async ({ page }) => {
  for (const p of ['/face2', '/animal', '/face-match', '/all']) {
    await page.goto(p)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://unse-ai.com${p}`)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://unse-ai.com/en${p}`)
  }
  await page.goto('/')
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://unse-ai.com/en')
})

test('영어 하단 탭은 Home·All 둘이다', async ({ page }) => {
  await page.goto('/en/face2')
  const bar = page.getByRole('navigation', { name: 'Bottom menu' })
  await expect(bar.getByRole('link')).toHaveCount(2)
  await expect(bar.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/en/all')
  await expect(bar.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/en')
})

test('한국어 /face2에서 언어 메뉴로 English를 고르면 /en/face2로 가고 영어를 기억한다', async ({ page, context }) => {
  await page.goto('/face2')
  await page.getByRole('button', { name: '언어' }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en\/face2$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect((await context.cookies()).find((c) => c.name === 'lang')?.value).toBe('en')
})

test('영어판이 없는 /saju에서 English를 고르면 영어 홈으로 가고 한국어만 있다는 안내가 뜬다', async ({ page }) => {
  await page.goto('/saju')
  const sw = page.getByRole('button', { name: '언어' })
  await sw.click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en\?only=ko$/)
  await expect(page.getByText('This page is only in Korean')).toBeVisible()
})

test('영어 /en/face2에서 한국어를 고르면 /face2로 간다', async ({ page }) => {
  await page.goto('/en/face2')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('menuitemradio', { name: '한국어' }).click()
  await expect(page).toHaveURL(/\/face2$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
})

test('쿠키 없는 요청은 미국 IP·영어 브라우저여도 리디렉션(307)이 없다(검색 로봇)', async ({ request }) => {
  for (const p of ['/', '/face2', '/animal', '/face-match', '/face2/r/earth-mid', '/saju']) {
    const res = await request.get(p, { maxRedirects: 0, headers: { 'x-vercel-ip-country': 'US', 'accept-language': 'en-US,en;q=0.9' } })
    expect(res.status(), p).toBe(200)
    expect(res.headers()['location'], p).toBeUndefined()
  }
})

test('lang=en 쿠키가 있으면 영어판이 있는 한국어 주소는 /en으로 307, 없는 주소는 그대로', async ({ request }) => {
  const r = await request.get('/face2?x=1', { maxRedirects: 0, headers: { cookie: 'lang=en' } })
  expect(r.status()).toBe(307)
  expect(r.headers()['location']).toMatch(/\/en\/face2\?x=1$/)
  const s = await request.get('/saju', { maxRedirects: 0, headers: { cookie: 'lang=en' } })
  expect(s.status()).toBe(200)
  const k = await request.get('/en/animal', { maxRedirects: 0, headers: { cookie: 'lang=ko' } })
  expect(k.status()).toBe(307)
  expect(k.headers()['location']).toMatch(/\/animal$/)
})

test('해외 방문자(안내 쿠키)에게는 "View this page in English" 띠가 마운트 뒤에 뜨고, 누르면 영어판으로 간다', async ({ page, context, baseURL }) => {
  const html = await (await page.request.get('/face2')).text()
  expect(html).not.toContain('View this page in English') // 서버 HTML에는 없다
  await context.addCookies([{ name: 'lang_suggest', value: 'en', url: baseURL! }])
  await page.goto('/face2')
  const banner = page.getByRole('button', { name: 'View this page in English' })
  await expect(banner).toBeVisible()
  await banner.click()
  await expect(page).toHaveURL(/\/en\/face2$/)
  expect((await context.cookies()).find((c) => c.name === 'lang')?.value).toBe('en')
})

test('안내 띠를 닫으면 한국어를 기억해 다시 안 뜬다', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'lang_suggest', value: 'en', url: baseURL! }])
  await page.goto('/face2')
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'View this page in English' })).toHaveCount(0)
  expect((await context.cookies()).find((c) => c.name === 'lang')?.value).toBe('ko')
})

test('영어판이 없는 한국어 페이지에는 안내 띠가 뜨지 않는다', async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: 'lang_suggest', value: 'en', url: baseURL! }])
  await page.goto('/saju')
  await page.waitForTimeout(500)
  await expect(page.getByRole('button', { name: 'View this page in English' })).toHaveCount(0)
})

// ===== 영어 결과 흐름 (개발용 얼굴이 있을 때만) =====
import { existsSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { blankPng, trackErrors } from './helpers'

const F = 'public/dev-faces/person2.jpg' // 정면 여성
const M = 'public/dev-faces/person6.jpg' // 정면 남성
const has = existsSync(F) && existsSync(M)

async function recordShare(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: ShareData[] }
    w.__shared = []
    Object.assign(navigator, { canShare: () => true, share: async (d: ShareData) => { w.__shared.push({ title: d.title, text: d.text, url: d.url }) } })
  })
}
const shared = (page: Page) => page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared[0])
const visibleHangul = async (page: Page) => (await page.evaluate(() => document.body.innerText)).match(HANGUL)?.join('') ?? ''

test('영어 동물상: 사진 → 영어 결과 카드 → 공유 링크는 /en/animal/r/...', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  const errors = trackErrors(page)
  await recordShare(page)
  await page.goto('/en/animal')
  await page.locator('input[type=file]').setInputFiles(F)
  await page.getByRole('radio', { name: 'Female', exact: true }).click()
  await page.getByRole('button', { name: 'Find my animal' }).click()
  await expect(page.getByRole('button', { name: 'Try again' }).first()).toBeVisible({ timeout: 30000 })
  await expect(page.locator('article').first()).toContainText(/\d+% match/)
  await expect(page.locator('article').first()).toContainText('Read your fate')
  expect(await visibleHangul(page), '결과 화면의 한글').toBe('')
  await expect(page.getByRole('button', { name: /Share/ })).toBeVisible()
  await expect(page.locator('a[href^="/bujeok"]')).toHaveCount(0)
  await expect(page.getByText('Match with a friend')).toBeVisible()
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect.poll(async () => (await shared(page))?.url ?? '').toMatch(/\/en\/animal\/r\/[a-z]+\?s=\d\d&utm_source=share&utm_medium=friend_link/)
  expect((await shared(page)).text).toMatch(/^I'm \d\d% .+ Face\. Which animal are you\?$/)
  expect(errors).toEqual([])
})

test('영어 관상: 사진 → 공개 모션 건너뛰기 → 영어 결과 → 공유 링크는 /en/face2/r/...', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  const errors = trackErrors(page)
  await recordShare(page)
  await page.goto('/en/face2')
  await page.locator('input[type=file]').setInputFiles(F)
  await page.getByRole('radio', { name: 'Female', exact: true }).click()
  await page.getByRole('button', { name: 'Read my face' }).click()
  await page.getByRole('button', { name: 'Skip' }).click({ timeout: 30000 })
  await expect(page.getByRole('button', { name: 'Try again' }).first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByRole('heading', { name: 'Why this type?' })).toBeVisible()
  expect(await visibleHangul(page), '결과 화면의 한글').toBe('')
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect.poll(async () => (await shared(page))?.url ?? '').toMatch(/\/en\/face2\/r\/(wood|fire|earth|metal|water)-(up|mid|down)\?utm_source=share/)
  expect(errors).toEqual([])
})

test('영어 얼굴 궁합: 두 사진 → 영어 결과 → 공유 링크는 /en/face-match/r/...', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  const errors = trackErrors(page)
  await recordShare(page)
  await page.goto('/en/face-match')
  await expect(page.getByRole('button', { name: 'Choose your relationship first' })).toBeDisabled()
  await page.getByRole('radio', { name: 'Couple' }).click()
  const me = page.getByRole('region', { name: 'Me' })
  await me.getByRole('radio', { name: 'Female', exact: true }).click()
  await me.locator('input[type=file]').setInputFiles(F)
  const other = page.getByRole('region', { name: 'Your partner' })
  await other.getByRole('radio', { name: 'Male', exact: true }).click()
  await other.locator('input[type=file]').setInputFiles(M)
  await page.getByRole('button', { name: 'Check our match' }).click()
  const card = page.locator('article').first()
  await expect(card).toContainText(/Couple match: \d+ points/, { timeout: 30000 })
  await expect(card).toContainText(/Friends \d+ points · Crush \d+ points/)
  expect(await visibleHangul(page), '결과 화면의 한글').toBe('')
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect.poll(async () => (await shared(page))?.url ?? '').toMatch(/\/en\/face-match\/r\/[a-z]+-[a-z]+\?rel=lover/)
  expect(errors).toEqual([])
})

test('영어 시작 화면: 얼굴 없는 사진도 영어 안내를 보여 준다', async ({ page }) => {
  await page.goto('/en/animal')
  await page.locator('input[type=file]').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: await blankPng(page) })
  await expect(page.getByRole('button', { name: 'Choose your gender first' })).toBeDisabled()
  await page.getByRole('radio', { name: 'Female', exact: true }).click()
  await page.getByRole('button', { name: 'Find my animal' }).click()
  await expect(page.getByText(/No face found/)).toBeVisible({ timeout: 30000 })
  expect(await visibleHangul(page)).toBe('')
})

// ===== 영어 공유 착지·미리보기 이미지·사이트맵 =====
for (const [p, h1] of [['/en/animal/r/cat?s=88', /88% Cat Face/], ['/en/face2/r/earth-mid', /Someone got/], ['/en/face-match/r/cat-dog?rel=lover', /Face match result/]] as const) {
  test(`${p}: 영어 착지, noindex, 영어 테스트로 가는 버튼`, async ({ page }) => {
    await page.goto(p)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    const path = p.split('?')[0]
    const test = path.includes('animal') ? '/en/animal' : path.includes('face2') ? '/en/face2' : '/en/face-match'
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://unse-ai.com${test}`)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /lang=en/)
    expect(await page.title()).not.toMatch(HANGUL)
    if (!p.includes('face-match')) await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1)
    await expect(page.getByRole('link', { name: 'Try it yourself' })).toHaveAttribute('href', test)
    expect((await page.evaluate(() => document.body.innerText)).match(HANGUL)?.join('') ?? '').toBe('')
  })
}

test('영어 결과 착지는 잘못된 키면 영어 테스트 시작 화면으로 간다', async ({ page }) => {
  await page.goto('/en/animal/r/nope?s=88')
  await expect(page).toHaveURL(/\/en\/animal$/)
  await page.goto('/en/face-match/r/cat-dog?rel=bad')
  await expect(page).toHaveURL(/\/en\/face-match$/)
})

test('영어 미리보기 이미지는 lang=en만 그리고 그 밖은 400', async ({ request }) => {
  for (const u of ['kind=animal&key=cat&s=88&lang=en', 'kind=face&key=earth-mid&lang=en', 'kind=face-match&a=cat&b=dog&rel=lover&lang=en']) {
    const r = await request.get(`/api/og/result?${u}`)
    expect(r.status(), u).toBe(200)
    expect(r.headers()['content-type'], u).toContain('image/png')
  }
  expect((await request.get('/api/og/result?kind=animal&key=cat&s=88&lang=ja')).status()).toBe(400)
  expect((await request.get('/api/og/result?kind=samguk&key=guanyu&s=88&lang=en')).status()).toBe(400)
  expect((await request.get('/api/og/result?kind=animal&key=cat&s=88')).status()).toBe(200)
})

test('사이트맵에 영어 주소와 언어 짝이 있다', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  for (const u of ['/en', '/en/all', '/en/face2', '/en/animal', '/en/face-match']) expect(xml).toContain(`<loc>https://unse-ai.com${u}</loc>`)
  expect(xml).not.toMatch(/<loc>https:\/\/unse-ai\.com\/en\/[a-z0-9-]+\/r\//)
  expect(xml).toMatch(/hreflang="en" href="https:\/\/unse-ai\.com\/en\/face2"/)
  expect(xml).toMatch(/hreflang="ko" href="https:\/\/unse-ai\.com\/face2"/)
})

test('lang=en 쿠키가 있어도 영어 착지는 그대로 열린다', async ({ request }) => {
  const r = await request.get('/en/animal/r/cat?s=88', { maxRedirects: 0, headers: { cookie: 'lang=en' } })
  expect(r.status()).toBe(200)
})

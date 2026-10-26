import { test, expect } from '@playwright/test'

const meta = async (page: import('@playwright/test').Page, sel: string) => page.locator(sel).first().getAttribute('content')

test('친구 결과 링크(동물상): 서버 미리보기 메타·검색 제외, 착지 화면에서 나도 해보기', async ({ page, request }) => {
  const html = await (await request.get('/animal/r/cat?s=87&utm_source=share&utm_medium=friend_link&utm_campaign=animal')).text()
  expect(html).toContain('나는 고양이상 87% 나왔어. 너는 무슨 상이야?') // JS 없이도 서버 HTML에 있다(카톡 미리보기 봇)
  await page.goto('/animal/r/cat?s=87&utm_source=share&utm_medium=friend_link&utm_campaign=animal')
  expect(await meta(page, 'meta[property="og:title"]')).toBe('나는 고양이상 87% 나왔어. 너는 무슨 상이야?')
  expect(await meta(page, 'meta[property="og:image"]')).toContain('/api/og/result?kind=animal&key=cat&s=87')
  expect(await meta(page, 'meta[name="robots"]')).toContain('noindex')
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://unse-ai.com/animal')
  await expect(page.getByRole('heading', { name: '친구는 고양이상이 나왔어요' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).some((a) => a[0] === 'event' && a[1] === 'shared_landing'))).toBe(true)
  await page.getByRole('link', { name: '나도 해보기' }).click()
  await expect(page).toHaveURL(/\/animal$/)
})

test('친구 결과 링크(삼국지·관상) 착지 문구', async ({ page }) => {
  await page.goto('/samguk/r/zhaoyun?s=84')
  await expect(page.getByRole('heading', { name: '친구는 조운을 닮았대요' })).toBeVisible()
  await page.goto('/face2/r/wealth')
  await expect(page.getByRole('heading', { name: '친구는 재물상이 나왔어요' })).toBeVisible()
})

test('잘못된 결과 링크는 테스트 시작 화면으로 보낸다 (예약 키 포함, 500 없음)', async ({ page, request }) => {
  expect((await request.get('/face2/r/constructor', { maxRedirects: 0 })).status()).toBe(307)
  expect((await request.get('/api/og/result?kind=face&key=constructor')).status()).toBe(400)
  await page.goto('/mbti/r/infp-xxxx')
  await expect(page).toHaveURL(/\/mbti\/match$/)
  await page.goto('/animal/r/unicorn?s=87')
  await expect(page).toHaveURL(/\/animal$/)
  await page.goto('/samguk/r/zhaoyun?s=abc')
  await expect(page).toHaveURL(/\/samguk$/)
})

test('MBTI 궁합 링크: 결과 미리보기 메타와 친구가 보낸 궁합 안내', async ({ page }) => {
  await page.goto('/mbti/r/infp-entj?utm_source=share&utm_medium=friend_link&utm_campaign=mbti_match')
  expect(await meta(page, 'meta[property="og:title"]')).toBe('INFP랑 ENTJ 궁합 100점이래. 우리도 해볼까?')
  await expect(page.getByText('친구가 보낸 궁합이에요')).toBeVisible()
  await page.getByRole('button', { name: '내 궁합 보기' }).click()
  await expect(page.getByRole('button', { name: '궁합 보기' })).toBeVisible()
})

test('결과 미리보기 이미지: 1200×630 PNG, 잘못된 값은 400', async ({ request }) => {
  const ok = await request.get('/api/og/result?kind=samguk&key=zhaoyun&s=84')
  expect(ok.status()).toBe(200)
  expect(ok.headers()['content-type']).toContain('image/png')
  expect((await request.get('/api/og/result?kind=animal&key=../../x&s=84')).status()).toBe(400)
})

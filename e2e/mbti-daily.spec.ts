import { test, expect, type Page } from '@playwright/test'
import { mbtiDaily } from '../src/lib/mbti/daily'
import { trackErrors } from './helpers'

test.use({ serviceWorkers: 'block' })

const at = (page: Page, iso: string) => page.clock.setFixedTime(new Date(iso))
const D27 = '2026-10-27T01:00:00Z' // 10월 27일 오전 10시 (한국)
const D28 = '2026-10-28T01:00:00Z'

test('MBTI 고르기 → 오늘 운세 카드, 다시 열면 기억한 유형으로 바로, 날이 바뀌면 한마디도 바뀐다', async ({ page }) => {
  const errors = trackErrors(page)
  await at(page, D27)
  await page.goto('/fortune/mbti')
  await expect(page.getByRole('heading', { level: 1, name: '오늘의 MBTI 운세' })).toBeVisible()
  await page.getByRole('button', { name: 'INFP', exact: true }).click()
  const card = page.locator('article').first()
  await expect(card).toContainText('10월 27일')
  await expect(card).toContainText(mbtiDaily('INFP', '2026-10-27').headline)
  await expect(card).toContainText(mbtiDaily('INFP', '2026-10-27').work)
  await expect(card).toContainText('unse-ai.com')
  await expect.poll(() => page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).some((a) => a[0] === 'event' && a[1] === 'result_view' && (a[2] as { result_id?: string }).result_id === 'INFP'))).toBe(true)
  await page.reload()
  await expect(page.locator('article').first()).toContainText(mbtiDaily('INFP', '2026-10-27').headline)
  await at(page, D28)
  await page.reload()
  await expect(page.locator('article').first()).toContainText(mbtiDaily('INFP', '2026-10-28').headline)
  await page.getByRole('button', { name: '다른 유형 보기' }).click()
  await expect(page.getByRole('button', { name: 'ENTJ', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('공유하기: 결과 링크(날짜 없음)와 1인칭 문구', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: ShareData[] }
    w.__shared = []
    Object.assign(navigator, { canShare: () => true, share: async (d: ShareData) => { w.__shared.push({ text: d.text, url: d.url }) } })
  })
  await at(page, D27)
  await page.goto('/fortune/mbti?t=infp')
  await page.getByRole('button', { name: '공유하기' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared.length)).toBe(1)
  const s = await page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared[0])
  expect(s.url).toBe('https://unse-ai.com/fortune/mbti/r/infp?utm_source=share&utm_medium=friend_link&utm_campaign=mbti_daily')
  expect(s.text).toBe(`오늘 INFP 운세는 '${mbtiDaily('INFP', '2026-10-27').headline}'래. 너는 무슨 유형이야?`)
})

test.describe('카카오톡 인앱', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.9.0' })
  test('공유하기: 카카오톡 카드(링크·미리보기 kind=mbti-daily)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __kakao: unknown[]; Kakao: unknown }
      w.__kakao = []
      let inited = false
      w.Kakao = { isInitialized: () => inited, init: () => { inited = true }, Share: { sendDefault: (t: unknown) => w.__kakao.push(t) } }
    })
    await page.goto('/fortune/mbti?t=enfp')
    await page.getByRole('button', { name: '공유하기' }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { __kakao: unknown[] }).__kakao.length)).toBe(1)
    const t = await page.evaluate(() => (window as unknown as { __kakao: { content: { imageUrl: string; link: { mobileWebUrl: string } } }[] }).__kakao[0])
    expect(t.content.link.mobileWebUrl).toMatch(/\/fortune\/mbti\/r\/enfp\?utm_source=share/)
    expect(t.content.imageUrl).toBe('https://unse-ai.com/api/og/result?kind=mbti-daily&type=enfp')
  })
})

test('친구 링크 착지: 친구 오늘 운세 먼저, 기억한 내 유형이 있으면 "내 MBTI로 보기"가 내 결과로', async ({ page }) => {
  const errors = trackErrors(page)
  await at(page, D27)
  await page.goto('/fortune/mbti/r/entj?utm_source=share')
  await expect(page.getByText('친구가 보낸 오늘의 운세')).toBeVisible()
  await expect(page.locator('article').first()).toContainText(mbtiDaily('ENTJ', '2026-10-27').headline)
  expect(await page.locator('meta[name="robots"]').first().getAttribute('content')).toContain('noindex')
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://unse-ai.com/fortune/mbti')
  expect(await page.locator('meta[property="og:title"]').first().getAttribute('content')).toBe('친구의 오늘 ENTJ 운세가 도착했어요. 너는 무슨 유형이야?')
  await page.getByRole('link', { name: '내 MBTI로 보기' }).click()
  await expect(page).toHaveURL(/\/fortune\/mbti$/)
  await page.getByRole('button', { name: 'INFP', exact: true }).click()
  await page.goto('/fortune/mbti/r/entj')
  await page.getByRole('link', { name: '내 MBTI로 보기' }).click()
  await expect(page).toHaveURL(/\/fortune\/mbti\?t=infp$/)
  await expect(page.locator('article').first()).toContainText(mbtiDaily('INFP', '2026-10-27').headline)
  expect(errors).toEqual([])
})

test('잘못된 착지 주소: 대문자는 소문자로, 없는 유형은 시작 화면 (500 없음)', async ({ page, request }) => {
  expect((await request.get('/fortune/mbti/r/constructor', { maxRedirects: 0 })).status()).toBe(307)
  await page.goto('/fortune/mbti/r/INFP')
  await expect(page).toHaveURL(/\/fortune\/mbti\/r\/infp$/)
  await page.goto('/fortune/mbti/r/xxxx')
  await expect(page).toHaveURL(/\/fortune\/mbti$/)
  await page.goto('/fortune/mbti?t=zzzz')
  await expect(page.getByRole('button', { name: 'INFP', exact: true })).toBeVisible()
})

test('미리보기 이미지 kind=mbti-daily: PNG, 잘못된 유형은 400', async ({ request }) => {
  const ok = await request.get('/api/og/result?kind=mbti-daily&type=infp')
  expect(ok.status()).toBe(200)
  expect(ok.headers()['content-type']).toContain('image/png')
  expect((await request.get('/api/og/result?kind=mbti-daily&type=INFP')).status()).toBe(400)
})

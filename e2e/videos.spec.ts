import { test, expect } from '@playwright/test'
import { trackErrors } from './helpers'

test.use({ viewport: { width: 390, height: 844 } })

// 키 없이 빌드하므로 RSS 경로를 탄다. 네트워크가 없으면 빈 목록 문구만 확인한다.
async function hasVideos(page: import('@playwright/test').Page) {
  await page.goto('/samguk/videos')
  const n = await page.locator('[data-video-id]').count()
  if (n === 0) await expect(page.getByText('아직 올라온 영상이 없어요')).toBeVisible()
  return n
}

test('격자: 카드를 누르면 피드, 넘기면 iframe 1개, 닫으면 격자', async ({ page }) => {
  const errors = trackErrors(page)
  const n = await hasVideos(page)
  test.skip(n === 0, 'RSS를 받지 못해 영상이 없음')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('쇼츠로 보는 삼국지')
  expect(await page.locator('iframe[src*="youtube"]').count()).toBe(0)

  const first = page.locator('[data-video-id]').first()
  const id = await first.getAttribute('data-video-id')
  await first.click()
  const dialog = page.getByRole('dialog', { name: '쇼츠 보기' })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`\\?v=${id}`))
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  // 재생: iframe은 하나뿐
  await dialog.getByRole('button', { name: /재생$/ }).first().click()
  await expect(page.locator('iframe[src*="youtube-nocookie"]')).toHaveCount(1)

  if (n >= 2) {
    await dialog.locator('[data-index="1"]').scrollIntoViewIfNeeded()
    await expect(dialog.getByText(`2 / ${n}`)).toBeVisible()
    await dialog.getByRole('button', { name: /재생$/ }).first().click()
    await expect(page.locator('iframe[src*="youtube-nocookie"]')).toHaveCount(1)
    await expect(dialog.locator('[data-index="1"] iframe')).toHaveCount(1)
  }

  await dialog.getByRole('button', { name: '목록으로' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page).not.toHaveURL(/\?v=/)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await expect(page.locator('[data-video-id]').first()).toBeVisible()
  await expect(page.locator(`button[data-video-id="${id}"]`)).toBeFocused()
  expect(errors.filter((e) => !e.includes('youtube') && !e.includes('ytimg'))).toEqual([])
})

test('Esc로 닫힘, ?v=<id>로 바로 피드', async ({ page }) => {
  const n = await hasVideos(page)
  test.skip(n === 0, 'RSS를 받지 못해 영상이 없음')
  const id = await page.locator('[data-video-id]').last().getAttribute('data-video-id')
  await page.goto(`/samguk/videos?v=${id}`)
  const dialog = page.getByRole('dialog', { name: '쇼츠 보기' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('잘못된 ?v= 는 피드를 열지 않음', async ({ page }) => {
  await page.goto('/samguk/videos?v=<script>')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('쇼츠로 보는 삼국지')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/samguk/videos?v=AAAAAAAAAAA')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('피드의 테스트 버튼은 /samguk', async ({ page }) => {
  const n = await hasVideos(page)
  test.skip(n === 0, 'RSS를 받지 못해 영상이 없음')
  await page.locator('[data-video-id]').first().click()
  await page.getByRole('dialog').getByRole('link', { name: '나는 누구 닮았을까?' }).first().click()
  await expect(page).toHaveURL(/\/samguk$/)
})

test('피드는 하단 탭 위를 덮음', async ({ page }) => {
  const n = await hasVideos(page)
  test.skip(n === 0, 'RSS를 받지 못해 영상이 없음')
  await page.locator('[data-video-id]').first().click()
  const btn = page.getByRole('dialog').getByRole('link', { name: '구독' }).first()
  await expect(btn).toBeInViewport()
  const hit = await btn.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
  })
  expect(hit).toBe(true)
})

test('피드가 열리면 뒤쪽은 inert, 탭 포커스가 피드 안에 머묾', async ({ page }) => {
  const n = await hasVideos(page)
  test.skip(n === 0, 'RSS를 받지 못해 영상이 없음')
  await page.locator('[data-video-id]').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => document.querySelector('main')!.closest('[inert]') !== null)).toBe(true)
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]') || document.activeElement === document.body)).toBe(true)
  }
})

test('?v= 딥링크로 열고 닫으면 그 카드로 포커스', async ({ page }) => {
  const n = await hasVideos(page)
  test.skip(n === 0, 'RSS를 받지 못해 영상이 없음')
  const id = await page.locator('[data-video-id]').first().getAttribute('data-video-id')
  await page.goto(`/samguk/videos?v=${id}`)
  await page.getByRole('button', { name: '목록으로' }).click()
  await expect(page.locator(`button[data-video-id="${id}"]`)).toBeFocused()
})

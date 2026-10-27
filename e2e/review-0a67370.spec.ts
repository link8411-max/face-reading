// 0a67370..b06ec44 리뷰 반영 (2026-10-27)
import { test, expect, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'

const F = 'public/dev-faces/person2.jpg'
const M = 'public/dev-faces/person6.jpg'
const has = existsSync(F) && existsSync(M)

// 서비스 워커가 모델 파일을 대신 받으면 지연이 적용되지 않으므로 끈다
test.use({ serviceWorkers: 'block' })

// 분석 도구(모델 파일)를 늦게 받게 해서 "분석 중" 상태를 길게 만든다
async function slowModel(page: Page) {
  await page.route('**/face_landmarker.task', async (r) => { await new Promise((ok) => setTimeout(ok, 4000)); await r.continue() })
}

test('얼굴 궁합: 분석 중에는 관계·성별·사진을 바꿀 수 없다 (끝난 뒤 바꾼 사진이 되돌아가지 않게)', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  await slowModel(page)
  await page.goto('/face-match')
  await page.getByRole('radio', { name: '친구' }).click()
  for (const [label, g, f] of [['나', '여자', F], ['친구', '남자', M]] as const) {
    const slot = page.getByRole('region', { name: label })
    await slot.getByRole('radio', { name: g }).click()
    await slot.locator('input[type=file]').setInputFiles(f)
  }
  await page.getByRole('button', { name: '궁합 보기' }).click()
  await expect(page.getByRole('button', { name: '궁합 보는 중…' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '연인' })).toBeDisabled()
  const other = page.getByRole('region', { name: '친구' })
  await expect(other.getByRole('button', { name: '친구 사진 고르기' })).toBeDisabled()
  await expect(other.getByRole('radio', { name: '여자' })).toBeDisabled()
  await expect(other.locator('input[type=file]')).toBeDisabled()
  await expect(page.locator('article').first()).toContainText(/친구 궁합 \d+점/, { timeout: 40000 })
})

test('우리 팀: 분석 중에는 별칭·인원·사진을 바꿀 수 없다', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  await slowModel(page)
  await page.goto('/samguk/team')
  for (const [i, [f, g]] of ([[F, '여자'], [M, '남자']] as const).entries()) {
    const slot = page.getByRole('region', { name: `${i + 1}번 팀원` })
    await slot.getByRole('radio', { name: g }).click()
    await slot.locator('input[type=file]').setInputFiles(f)
  }
  await page.getByRole('button', { name: '우리 팀 결과 보기' }).click()
  await expect(page.getByRole('button', { name: '장수 찾는 중…' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '1번 팀원 별칭' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '한 명 더' })).toBeDisabled()
  await expect(page.getByRole('region', { name: '2번 팀원' }).getByRole('button', { name: '2번 팀원 사진 고르기' })).toBeDisabled()
  await expect(page.locator('article').first()).toContainText(/우리 팀은 /, { timeout: 40000 })
})

test('신년운세 공유하기: 누르자마자 공유창을 연다(이미지는 미리 만들어 둠)', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: { ms: number; files: number }[]; __down: number }
    w.__shared = []
    w.__down = 0
    addEventListener('pointerdown', () => { w.__down = performance.now() }, true)
    Object.assign(navigator, {
      canShare: () => true,
      share: async (d: ShareData) => { w.__shared.push({ ms: performance.now() - w.__down, files: d.files?.length ?? 0 }) },
    })
  })
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15', { exact: true }).fill('15')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  const btn = page.getByRole('button', { name: /공유하기/ }).first()
  await expect(btn).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(3000) // 결과 이미지를 미리 만드는 시간
  await btn.click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared.length)).toBe(1)
  const s = await page.evaluate(() => (window as unknown as { __shared: { ms: number; files: number }[] }).__shared[0])
  expect(s.files).toBe(1)
  expect(s.ms).toBeLessThan(150)
})

test('미리보기 이미지: CDN 장기 캐시, 쓸데없는 매개변수·점수 표기는 400', async ({ request }) => {
  const ok = await request.get('/api/og/result?kind=animal&key=cat&s=87')
  expect(ok.status()).toBe(200)
  expect(ok.headers()['cache-control']).toContain('s-maxage=31536000')
  expect((await request.get('/api/og/result?kind=animal&key=cat&s=87&zz=1')).status()).toBe(400)
  expect((await request.get('/api/og/result?kind=animal&key=cat&s=1e2')).status()).toBe(400)
})

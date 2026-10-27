import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { blankPng, trackErrors } from './helpers'

test('신년운세: 입력 → 결과 → 다시하기는 같은 페이지 입력 화면으로', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15', { exact: true }).fill('15')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('link', { name: /MBTI 궁합도 보기/ })).toHaveAttribute('href', '/mbti/match')
  await page.getByRole('button', { name: /다시하기/ }).first().click()
  await expect(page).toHaveURL(/\/fortune$/)
  await expect(page.getByPlaceholder('1990')).toBeVisible()
  await page.getByRole('button', { name: /돌아가기/ }).click()
  await expect(page).toHaveURL(/3200\/$/)
  expect(errors).toEqual([])
})

test('오늘의 운세: 입력 → 결과 → 다시하기', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('link', { name: /MBTI 궁합도 보기/ })).toHaveAttribute('href', '/mbti/match')
  await page.getByRole('button', { name: /다시하기/ }).first().click()
  await expect(page).toHaveURL(/\/fortune\/daily$/)
  await expect(page.getByPlaceholder('예: 1990')).toBeVisible()
  expect(errors).toEqual([])
})

test('삼국지: 성별 선택 전에는 시작 불가, 얼굴 없는 사진은 화면 안내 후 로딩 종료', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: await blankPng(page) })
  await expect(page.getByRole('button', { name: /성별을 먼저/ })).toBeDisabled()
  await page.getByRole('radio', { name: '남자' }).click()
  await expect(page.getByRole('radio', { name: '남자' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: /닮은 장수 찾기/ }).click()
  await expect(page.getByText(/얼굴을 찾지 못했어요/)).toBeVisible({ timeout: 30000 })
  await expect(page.getByRole('button', { name: /닮은 장수 찾기/ })).toBeVisible()
  expect(errors).toEqual([])
})

const FACE = 'public/dev-faces/person1.jpg'
test('삼국지: 실제 얼굴 → 결과 → 다시하기는 업로드 화면으로', async ({ page }) => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
  const errors = trackErrors(page)
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('radio', { name: '여자' }).click()
  await page.getByRole('button', { name: /닮은 장수 찾기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByText(/\d{2}%/).first()).toBeVisible()
  await page.getByRole('button', { name: /다시하기/ }).first().click()
  await expect(page).toHaveURL(/\/samguk$/)
  await expect(page.getByRole('radio', { name: '여자' })).toBeVisible()
  expect(errors).toEqual([])
})

for (const path of ['/face2', '/animal']) {
  test(`${path}: 얼굴 없는 사진도 멈추지 않고 안내`, async ({ page }) => {
    const errors = trackErrors(page)
    page.on('dialog', (d) => d.dismiss())
    await page.goto(path)
    await page.locator('input[type=file]').setInputFiles({ name: 'blank.png', mimeType: 'image/png', buffer: await blankPng(page) })
    if (path === '/face2') {
      // 관상은 성별을 묻지 않는다
      await expect(page.getByRole('radio', { name: '여자' })).toHaveCount(0)
    } else {
      await expect(page.getByRole('button', { name: /성별을 먼저/ })).toBeDisabled()
      await page.getByRole('radio', { name: '여자' }).click()
    }
    await page.getByRole('button', { name: /관상 보기|동물상 찾기/ }).click({ timeout: 30000 })
    await expect(page.getByText(path === '/animal' ? /얼굴을 찾지 못했어요/ : /얼굴을 감지할 수 없습니다/)).toBeVisible({ timeout: 30000 })
    expect(errors).toEqual([])
  })
}

// 결과 화면의 저장·공유 등 나머지 버튼도 모두 눌러 본다 (다시하기/돌아가기는 위 흐름에서 확인)
async function clickResultButtons(page: import('@playwright/test').Page) {
  page.on('dialog', (d) => d.dismiss())
  await page.evaluate(() => { (navigator as unknown as { share?: unknown }).share = undefined })
  // 누르는 동안 화면이 바뀌어 순서가 달라질 수 있으니, 라벨 목록을 먼저 뽑고 라벨로 다시 찾는다
  const labels = (await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter((t) => t && !/다시하기|돌아가기/.test(t))
  for (const label of [...new Set(labels)]) {
    const b = page.getByRole('button', { name: label, exact: true }).first()
    if (!(await b.isVisible().catch(() => false)) || !(await b.isEnabled())) continue
    const download = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    await b.click({ timeout: 5000 })
    await download
    await expect(page.locator('text=/캡쳐중|저장 중/')).toHaveCount(0, { timeout: 15000 })
    expect(new URL(page.url()).host, label).toBe('localhost:3200')
  }
}

test('신년운세 결과 화면 버튼을 모두 눌러도 오류가 없다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune')
  await page.getByPlaceholder('1990').fill('1990')
  await page.getByPlaceholder('5', { exact: true }).fill('5')
  await page.getByPlaceholder('15', { exact: true }).fill('15')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await clickResultButtons(page)
  expect(errors).toEqual([])
})

test('오늘의 운세 결과 화면 버튼을 모두 눌러도 오류가 없다', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/fortune/daily')
  await page.getByPlaceholder('예: 1990').fill('1990')
  await page.getByRole('button', { name: /운세 보기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 15000 })
  await clickResultButtons(page)
  expect(errors).toEqual([])
})

test('삼국지 결과 화면 버튼(공유·저장)을 모두 눌러도 오류가 없다', async ({ page }) => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
  const errors = trackErrors(page)
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('radio', { name: '남자' }).click()
  await page.getByRole('button', { name: /닮은 장수 찾기/ }).click()
  await expect(page.getByRole('button', { name: /다시하기/ }).first()).toBeVisible({ timeout: 30000 })
  await clickResultButtons(page)
  expect(errors).toEqual([])
})

test('삼국지 결과: 게임 카드(회사생활 STATUS) → 닮은 점 → 지켜줄 장수 → 버튼, 능력치는 펼쳐 본다', async ({ page }) => {
  test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
  const errors = trackErrors(page)
  await page.goto('/samguk')
  await page.locator('input[type=file]').setInputFiles(FACE)
  await page.getByRole('radio', { name: '남자' }).click()
  await page.getByRole('button', { name: /닮은 장수 찾기/ }).click()
  await expect(page.getByRole('button', { name: '공유하기' })).toBeVisible({ timeout: 30000 })
  const card = page.locator('article').first()
  await expect(card).toContainText('회사생활 STATUS')
  await expect(card.getByRole('meter')).toHaveCount(5)
  await expect(card).toContainText('UNSE-AI.COM')
  await expect(page.getByText(/처럼 .+ 닮았어요/)).toBeVisible()
  const guardian = page.getByRole('region', { name: '나를 지켜줄 장수' })
  await expect(guardian).toContainText(/궁합 \d{2}점/)
  const y = async (l: import('@playwright/test').Locator) => (await l.boundingBox())!.y
  expect(await y(card)).toBeLessThan(await y(guardian))
  expect(await y(guardian)).toBeLessThan(await y(page.getByRole('button', { name: '공유하기' })))
  await page.getByText('코에이 능력치 보기').click()
  await expect(page.getByRole('heading', { name: '능력치', exact: true })).toBeVisible()
  await expect(page.getByText('통솔', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

// 리뷰 Important: 분석 도구(MediaPipe WASM)를 못 받으면 '사진 문제'가 아니라 '도구를 못 불러옴'으로 안내
// 서비스 워커가 캐시한 WASM을 주면 차단이 안 되므로 서비스 워커를 끈 채로 본다
test.describe('분석 도구 차단', () => {
test.use({ serviceWorkers: 'block' })
for (const [path, btn] of [['/animal', '동물상 찾기'], ['/samguk', '닮은 장수 찾기']] as const) {
  test(`${path}: 분석 도구를 못 불러오면 그 사실을 안내한다`, async ({ page }) => {
    test.skip(!existsSync(FACE), '개발용 테스트 얼굴이 없으면 건너뜀')
    test.setTimeout(90000)
    await page.route('**/cdn.jsdelivr.net/**', (r) => r.abort())
    await page.goto(path)
    await page.locator('input[type=file]').setInputFiles(FACE)
    await page.getByRole('radio', { name: '여자' }).click()
    await page.getByRole('button', { name: btn }).click({ timeout: 30000 })
    await expect(page.getByText(/분석 도구를 불러오지 못했어요/)).toBeVisible({ timeout: 60000 })
  })
}
})

test('한 번 고른 성별은 다음 사진 테스트에서 미리 골라져 있다 (관상은 묻지 않음)', async ({ page }) => {
  await page.goto('/animal')
  await page.getByRole('radio', { name: '남자' }).click()
  await page.goto('/samguk')
  await expect(page.getByRole('radio', { name: '남자' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: '여자' }).click()
  await page.goto('/face-match')
  await page.getByRole('radio', { name: '친구' }).click()
  await expect(page.getByRole('region', { name: '나' }).getByRole('radio', { name: '여자' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('region', { name: '친구' }).getByRole('radio', { name: '여자' })).toHaveAttribute('aria-checked', 'false')
  await page.goto('/face2')
  await expect(page.getByRole('radio', { name: '여자' })).toHaveCount(0)
})

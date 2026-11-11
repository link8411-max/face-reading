import { readFileSync, writeFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { trackErrors } from './helpers'

const SHOT_DIR = process.env.BUJEOK_SHOT_DIR // 지정하면 저장된 PNG를 이 폴더에 복사해 눈으로 볼 수 있다

const events = (page: Page) =>
  page.evaluate(() => ((window as unknown as { dataLayer?: unknown[][] }).dataLayer ?? []).filter((a) => a[0] === 'event').map((a) => [a[1], a[2]] as [string, Record<string, string>]))

function pngSize(buf: Buffer) {
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

const FINISH_NAME = { paper: '종이', gold: '금박', holo: '홀로그램' } as const

async function make(page: Page, wish: string, style: string, finish: keyof typeof FINISH_NAME = 'gold') {
  await page.goto('/bujeok')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('나만의 부적')
  await expect(page.getByRole('button', { name: '부적 만들기' })).toBeDisabled()
  await page.getByRole('radio', { name: wish }).click()
  await page.getByRole('radio', { name: style }).click()
  await expect(page.getByRole('radio', { name: '금박' })).toHaveAttribute('aria-checked', 'true') // 기본 마감
  await page.getByRole('radio', { name: FINISH_NAME[finish], exact: true }).click()
  await page.getByRole('button', { name: '부적 만들기' }).click()
  await expect(page.getByTestId('bujeok-card')).toBeVisible()
  for (const n of ['잠금화면용 저장', '공유하기', '다시 만들기', '뒤집기', '확대', '축소']) await expect(page.getByRole('button', { name: n })).toBeVisible()
  await expect(page.getByRole('link', { name: '선물하기' })).toHaveAttribute('href', `/bujeok?mode=gift&style=${style === '전통' ? 'trad' : 'cute'}`)
}

async function pngOf(page: Page) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), page.getByRole('button', { name: '잠금화면용 저장' }).click()])
  expect(dl.suggestedFilename()).toBe('bujeok.png')
  return readFileSync((await dl.path())!)
}

for (const [label, viewport] of [['기본 화면', null], ['모바일 390×844', { width: 390, height: 844 }]] as const) {
  for (const [style, key] of [['전통', 'trad'], ['귀여운', 'cute']] as const) {
    for (const finish of ['paper', 'gold', 'holo'] as const) {
      test(`${label} ${style} ${FINISH_NAME[finish]}: 만들기 → 저장하면 1170×2532 PNG`, async ({ page }) => {
        const errors = trackErrors(page)
        if (viewport) await page.setViewportSize(viewport)
        await make(page, '재물', style, finish)
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
        const buf = await pngOf(page)
        expect(pngSize(buf)).toEqual({ w: 1170, h: 2532 })
        if (SHOT_DIR) writeFileSync(`${SHOT_DIR}/${key}-${finish}-${viewport ? 'm' : 'd'}.png`, buf)
        // 화면 밖에 세웠던 임시 DOM은 지워진다
        expect(await page.evaluate(() => document.querySelectorAll('[aria-hidden="true"][style*="-10000px"]').length)).toBe(0)
        const ev = await events(page)
        expect(ev.filter((e) => e[0] === 'result_view')).toEqual([['result_view', { test_name: 'bujeok', result_id: `${key}_money` }]])
        expect(errors).toEqual([])
      })
    }
  }
}

test('금박 저장 이미지와 홀로그램 저장 이미지는 서로 다르다(무지갯빛이 고정됨)', async ({ page }) => {
  await make(page, '재물', '전통', 'gold')
  const gold = await pngOf(page)
  await make(page, '재물', '전통', 'holo')
  const holo = await pngOf(page)
  expect(holo.equals(gold)).toBe(false)
})

test('뒤집기 버튼으로 뒷면 글이 보인다', async ({ page }) => {
  await make(page, '합격', '전통')
  const card = page.getByTestId('bujeok-card')
  await expect(card).toHaveAttribute('data-entering', 'false', { timeout: 10_000 })
  await expect(card).toHaveAttribute('data-face', 'front')
  await page.getByTestId('bujeok-flip').click()
  await expect(card).toHaveAttribute('data-face', 'back')
  await expect(page.getByTestId('bujeok-back')).toContainText('합격자 명단에 이름이 오른다는 뜻이에요')
  await expect(page.getByTestId('bujeok-back')).toContainText('준비한 만큼 힘을 내기를 응원해요')
})

test('손으로 밀면 돌아가서 뒷면에 멈춘다', async ({ page }) => {
  await make(page, '재물', '귀여운')
  const card = page.getByTestId('bujeok-card')
  await expect(card).toHaveAttribute('data-entering', 'false', { timeout: 10_000 })
  await page.getByTestId('bujeok-stage').scrollIntoViewIfNeeded()
  const box = (await page.getByTestId('bujeok-stage').boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + 20, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 20 + i * 28, y)
  await page.mouse.move(box.x + 20 + 12 * 28 + 1, y) // 멈췄다 놓으면 관성 없이 가까운 면(뒷면)에 선다
  await page.mouse.up()
  await expect(card).toHaveAttribute('data-face', 'back', { timeout: 8_000 })
})

test('확대·축소 버튼과 휠, 두 번 두드리기', async ({ page }) => {
  await make(page, '건강', '전통')
  const stage = page.getByTestId('bujeok-stage')
  await page.getByTestId('bujeok-zoom-in').click()
  await expect(stage).toHaveAttribute('data-zoom', '1.25')
  await page.getByTestId('bujeok-zoom-out').click()
  await page.getByTestId('bujeok-zoom-out').click()
  await expect(stage).toHaveAttribute('data-zoom', '0.75')
  const box = (await stage.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -300)
  expect(Number(await stage.getAttribute('data-zoom'))).toBeGreaterThan(0.75)
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2)
  await expect(stage).toHaveAttribute('data-zoom', '1')
  // 페이지 전체는 확대되지 않는다
  expect(await stage.evaluate((el) => getComputedStyle(el).touchAction)).toBe('none')
})

test('아이폰 사파리: 길게 눌러 저장 화면에 1170×2532 이미지가 뜬다', async ({ browser }) => {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    baseURL: 'http://localhost:3200',
  })
  const page = await ctx.newPage()
  await make(page, '합격', '전통', 'paper')
  await page.getByRole('button', { name: '잠금화면용 저장' }).click()
  const img = page.locator('#ios-save-modal img')
  await expect(img).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => `${i.naturalWidth}x${i.naturalHeight}`)).toBe('1170x2532')
  expect(await img.evaluate((i: HTMLImageElement) => i.src.startsWith('data:image/png'))).toBe(true)
  await ctx.close()
})

test('다시 만들기를 연타해도 오류 없이 카드가 하나만 남아 등장을 마친다', async ({ page }) => {
  const errors = trackErrors(page)
  await make(page, '건강', '귀여운')
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: '다시 만들기' }).click()
  await expect(page.getByTestId('bujeok-card')).toHaveAttribute('data-entering', 'false', { timeout: 10_000 })
  await expect(page.getByRole('button', { name: '잠금화면용 저장' })).toBeVisible()
  expect(errors).toEqual([])
})

test('없는 날짜는 안내가 뜨고 만들기가 막힌다', async ({ page }) => {
  await page.goto('/bujeok')
  await page.getByRole('radio', { name: '연애' }).click()
  await page.getByRole('radio', { name: '귀여운' }).click()
  await page.getByLabel('년도').fill('1990')
  await page.getByLabel('월').fill('2')
  await page.getByLabel('일').fill('30')
  await expect(page.locator('p[role="alert"]')).toContainText('2월은 28일까지 있어요')
  await expect(page.getByRole('button', { name: '부적 만들기' })).toBeDisabled()
})

test('?mode=gift&style=cute로 열면 화풍이 미리 골라져 있고, 모르는 값은 무시한다', async ({ page }) => {
  await page.goto('/bujeok?mode=gift&style=cute&wish=zzz')
  await expect(page.getByRole('radio', { name: '귀여운' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: '재물' })).toHaveAttribute('aria-checked', 'false')
})

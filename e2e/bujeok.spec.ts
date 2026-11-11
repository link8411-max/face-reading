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

test('확대·축소 버튼과 ctrl+휠, 두 번 두드리기', async ({ page }) => {
  await make(page, '건강', '전통')
  const stage = page.getByTestId('bujeok-stage')
  await page.getByTestId('bujeok-zoom-in').click()
  await expect(stage).toHaveAttribute('data-zoom', '1.25')
  await page.getByTestId('bujeok-zoom-out').click()
  await page.getByTestId('bujeok-zoom-out').click()
  await expect(stage).toHaveAttribute('data-zoom', '0.75')
  const box = (await stage.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  // 그냥 휠은 페이지 스크롤이라 확대되지 않는다. ctrl+휠(트랙패드 핀치)만 확대한다
  await page.mouse.wheel(0, -300)
  await expect(stage).toHaveAttribute('data-zoom', '0.75')
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -300)
  await page.keyboard.up('Control')
  await expect.poll(async () => Number(await stage.getAttribute('data-zoom'))).toBeGreaterThan(0.75)
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2)
  await expect(stage).toHaveAttribute('data-zoom', '1')
  // 세로로 밀면 페이지가 스크롤되고 가로로 밀면 카드가 돈다
  expect(await stage.evaluate((el) => getComputedStyle(el).touchAction)).toBe('pan-y')
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

// --- 선물하기와 착지 ---
async function makeGift(page: Page, opts: { to: string; from?: string; wish?: string; style?: string; finish?: keyof typeof FINISH_NAME }) {
  await page.addInitScript(() => {
    ;(navigator as unknown as { share: (d: unknown) => Promise<void> }).share = async (d) => {
      ;(window as unknown as { __shared: unknown }).__shared = d
    }
  })
  await page.goto('/bujeok?mode=gift')
  await expect(page.getByLabel('년도')).toHaveCount(0) // 선물에는 생년월일 칸이 없다
  await expect(page.getByRole('button', { name: '부적 만들기' })).toBeDisabled()
  await page.getByRole('radio', { name: opts.wish ?? '합격' }).click()
  await page.getByRole('radio', { name: opts.style ?? '전통' }).click()
  await page.getByRole('radio', { name: FINISH_NAME[opts.finish ?? 'gold'], exact: true }).click()
  await page.getByLabel('받는 사람 이름').fill(opts.to)
  if (opts.from) await page.getByLabel('보내는 사람 이름').fill(opts.from)
  await expect(page.getByRole('button', { name: '부적 만들기' })).toBeEnabled()
  await page.getByRole('button', { name: '부적 만들기' }).click()
  await expect(page.getByTestId('bujeok-card')).toBeVisible()
  await expect(page.getByRole('button', { name: '선물 보내기' })).toBeVisible()
  await page.getByRole('button', { name: '선물 보내기' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared?: unknown }).__shared !== undefined)).toBe(true)
  return (await page.evaluate(() => (window as unknown as { __shared: { url: string } }).__shared.url)) as string
}

test('선물 만들기 → 링크를 새 탭에서 열기 → 열어 보기 → 세 버튼 → 나도 보내기는 같은 화풍으로 선물 모드', async ({ page, context }) => {
  const errors = trackErrors(page)
  const url = await makeGift(page, { to: '민지', from: '철수', wish: '연애', style: '귀여운', finish: 'holo' })
  expect(url).toMatch(/\/bujeok\/r\/cute-love-[a-z]+-\d-holo\?utm_source=share&utm_medium=friend_link#to=%EB%AF%BC%EC%A7%80&from=/)
  expect(url.split('#')[0]).not.toMatch(/민지|철수|%EB/)
  const events1 = JSON.stringify(await events(page))
  expect(events1).not.toMatch(/민지|철수/)

  const guest = await context.newPage()
  const gErrors = trackErrors(guest)
  await guest.goto(new URL(url).pathname + new URL(url).search + new URL(url).hash)
  await expect(guest.getByRole('heading', { level: 1 })).toHaveText('민지님께 부적이 도착했어요')
  await expect(guest.getByTestId('bujeok-card')).toHaveCount(0)
  // 이름은 화면에만: 문서 제목과 dataLayer(GA로 가는 값)에는 없다
  expect(await guest.title()).not.toMatch(/민지|철수/)
  expect(await guest.title()).toContain('부적이 도착했어요')
  expect(JSON.stringify(await guest.evaluate(() => (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []))).not.toMatch(/민지|철수|%EB%AF%BC/)
  await guest.getByRole('button', { name: '열어 보기' }).click()
  await expect(guest.getByTestId('bujeok-card')).toBeVisible()
  await expect(guest.getByText('철수님이 보냈어요')).toBeVisible()
  await expect(guest.getByRole('button', { name: '잠금화면용 저장' })).toBeVisible()
  await expect(guest.getByRole('link', { name: '나도 보내기' })).toBeVisible()
  await expect(guest.getByRole('link', { name: '내 부적 만들기' })).toBeVisible()
  // 뒷면에 받는 사람 이름과 보낸 사람
  await expect(guest.getByTestId('bujeok-card')).toHaveAttribute('data-entering', 'false', { timeout: 10_000 })
  await guest.getByTestId('bujeok-flip').click()
  await expect(guest.getByTestId('bujeok-back')).toContainText('민지')
  await expect(guest.getByTestId('bujeok-back')).toContainText('철수')
  // 받은 쪽 저장 이미지
  const [dl] = await Promise.all([guest.waitForEvent('download', { timeout: 30_000 }), guest.getByRole('button', { name: '잠금화면용 저장' }).click()])
  expect(pngSize(readFileSync((await dl.path())!))).toEqual({ w: 1170, h: 2532 })
  const landing = (await events(guest)).filter((e) => e[0] === 'shared_landing')
  expect(landing).toEqual([['shared_landing', { test_name: 'bujeok', result_id: 'cute_love' }]])
  expect(JSON.stringify(await events(guest))).not.toMatch(/민지|철수/)

  await guest.getByRole('link', { name: '나도 보내기' }).click()
  await expect(guest).toHaveURL(/\/bujeok\?mode=gift&style=cute&finish=holo/)
  await expect(guest.getByRole('radio', { name: '귀여운' })).toHaveAttribute('aria-checked', 'true')
  await expect(guest.getByRole('radio', { name: '홀로그램', exact: true })).toHaveAttribute('aria-checked', 'true')
  await expect(guest.getByLabel('받는 사람 이름')).toHaveValue('')
  await expect(guest.getByRole('radio', { name: '재물' })).toHaveAttribute('aria-checked', 'false')
  expect(errors).toEqual([])
  expect(gErrors).toEqual([])
})

test('착지 "내 부적 만들기"는 받은 소원·화풍·마감을 미리 고른다', async ({ page }) => {
  await page.goto('/bujeok/r/trad-pass-wood-2-paper#to=%EB%AF%BC%EC%A7%80')
  await page.getByRole('button', { name: '열어 보기' }).click()
  await page.getByRole('link', { name: '내 부적 만들기' }).click()
  await expect(page).toHaveURL(/\/bujeok\?wish=pass&style=trad&finish=paper/)
  await expect(page.getByRole('radio', { name: '합격' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('radio', { name: '종이', exact: true })).toHaveAttribute('aria-checked', 'true')
})

test('해시의 이름이 잘못된 링크(9자·이모지·태그)는 이름 없이 열리고, 쿼리의 to·from은 무시한다', async ({ page }) => {
  for (const bad of ['%EA%B0%80%EB%82%98%EB%8B%A4%EB%9D%BC%EB%A7%88%EB%B0%94%EC%82%AC%EC%95%84%EC%9E%90', '%3Cscript%3Ealert(1)%3C%2Fscript%3E', '%EB%AF%BC%EC%A7%80%F0%9F%98%80']) {
    await page.goto(`/bujeok/r/trad-money-metal-0-gold#to=${bad}&from=${bad}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('부적이 도착했어요')
    expect(await page.locator('body').innerText()).not.toMatch(/alert\(1\)|가나다라마바사아자|😀/)
  }
  // 옛 형식(쿼리)은 이름으로 쓰지 않는다
  await page.goto('/bujeok/r/trad-money-metal-0-gold?to=%EB%AF%BC%EC%A7%80')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('부적이 도착했어요')
})

test('착지 메타: 이름 없음(쿼리를 줘도), noindex, canonical /bujeok, 이미지는 실제로 받아진다', async ({ page, request }) => {
  const html = await (await request.get('/bujeok/r/trad-money-metal-0-gold?to=%EB%AF%BC%EC%A7%80&from=%EC%B2%A0%EC%88%98')).text()
  expect(html).toMatch(/<meta name="robots" content="noindex/)
  expect(html).toContain('<link rel="canonical" href="https://unse-ai.com/bujeok"')
  expect(html).toContain('<title>부적이 도착했어요 | 운명을 읽다</title>')
  expect(html.replace(/<script[\s\S]*?<\/script>/g, '')).not.toMatch(/민지|철수/)
  const og = html.match(/<meta property="og:image" content="([^"]+)"/)![1].replace(/&amp;/g, '&')
  expect(og).toContain('kind=bujeok')
  expect(og).not.toMatch(/to=|from=|민지/)
  const img = await request.get(new URL(og).pathname + new URL(og).search)
  expect(img.status()).toBe(200)
  expect(img.headers()['content-type']).toContain('image/png')
  // 이름을 달면 미리보기 이미지는 요청을 받지 않는다
  expect((await request.get(new URL(og).pathname + new URL(og).search + '&to=x')).status()).toBe(400)
  // 내 부적 링크의 제목
  const mine = await (await request.get('/bujeok/r/trad-money-metal-0-gold?me=1')).text()
  expect(mine).toContain('<title>나의 부적 | 운명을 읽다</title>')
})

test('잘못된 코드는 /bujeok 으로 가고, 사이트맵에 /bujeok/r/ 은 없다', async ({ page, request }) => {
  for (const c of ['trad-money-metal-9-gold', 'trad-money-metal-0', 'oil-money-metal-0-gold']) {
    await page.goto(`/bujeok/r/${c}#to=%EB%AF%BC%EC%A7%80`)
    await expect(page).toHaveURL(/\/bujeok(#.*)?$/) // 브라우저가 해시를 그대로 들고 간다(서버는 모름)
    await expect(page.getByRole('button', { name: '부적 만들기' })).toBeVisible()
  }
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).not.toContain('/bujeok/r/')
})

// --- 광고: 부적 아래에만 ---
// (e2e 서버에는 ZIPSISE_DATA_URL이 없어 집시세 데이터가 없다 → 쿠팡 배너가 대신 뜬다. 집시세 배너는 단위 테스트와 별도 수동 확인으로 본다)
test('완성 화면: 광고는 카드 아래에 있고 카드 위·앞에는 없다', async ({ page }) => {
  await make(page, '재물', '전통')
  const frame = page.locator('iframe[title="쿠팡 추천 상품"]')
  await expect(frame).toHaveCount(1)
  const card = (await page.getByTestId('bujeok-card').boundingBox())!
  await frame.scrollIntoViewIfNeeded()
  const ad = (await frame.boundingBox())!
  const cardAfter = (await page.getByTestId('bujeok-card').boundingBox())!
  expect(ad.y).toBeGreaterThan(cardAfter.y + cardAfter.height - 1)
  expect(card.height).toBeGreaterThan(100)
  // 카드 안에는 광고가 없다
  expect(await page.getByTestId('bujeok-card').locator('iframe').count()).toBe(0)
})

test('착지: 열기 전에는 광고가 없고 연 뒤 카드 아래에 있다', async ({ page }) => {
  await page.goto('/bujeok/r/cute-pass-wood-1-paper#to=%EB%AF%BC%EC%A7%80')
  await expect(page.locator('iframe[title="쿠팡 추천 상품"]')).toHaveCount(0)
  await page.getByRole('button', { name: '열어 보기' }).click()
  const frame = page.locator('iframe[title="쿠팡 추천 상품"]')
  await expect(frame).toHaveCount(1)
  await expect(frame).toHaveAttribute('src', /subId=bujeok-pass/)
  const card = (await page.getByTestId('bujeok-card').boundingBox())!
  await frame.scrollIntoViewIfNeeded()
  const cardAfter = (await page.getByTestId('bujeok-card').boundingBox())!
  expect((await frame.boundingBox())!.y).toBeGreaterThan(cardAfter.y + cardAfter.height - 1)
  expect(card.height).toBeGreaterThan(100)
})

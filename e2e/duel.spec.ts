import { test, expect, type Page } from '@playwright/test'
import { trackErrors } from './helpers'

// 삼국지 일기토: Phaser 캔버스 위의 투명 DOM 버튼(aria-label)을 눌러 실제로 플레이한다.
// 고정 sleep 대신 window.__duel(scene·phase·wave·animating)을 기다린다.

type DuelState = { scene: string; phase?: string; wave?: number; animating: boolean }
const state = (page: Page) => page.evaluate(() => (window as unknown as { __duel?: DuelState }).__duel ?? null)

// 오버레이 버튼은 aria-label이 장수·기술 이름으로 바뀌므로 고정 id(data-duel-btn)로 찾는다
const btn = (page: Page, id: string) => page.locator(`button[data-duel-btn="${id}"]`)

async function idle(page: Page) {
  await page.waitForFunction(() => {
    const d = (window as unknown as { __duel?: DuelState }).__duel
    return !!d && !d.animating
  })
}

// 첫 화면 → 관우 선택 → 출진 → 웨이브 minWave 전투까지. 첫 전투 화면에서 onBattle 검사를 한 번 돈다
async function playTo(page: Page, minWave: number, onBattle?: () => Promise<void>) {
  await page.goto('/samguk/duel?seed=7')
  await page.waitForFunction(() => (window as unknown as { __duel?: DuelState }).__duel?.scene === 'start')
  await idle(page)
  await btn(page, 'general0').click()
  await idle(page)
  await btn(page, 'sortie').click()
  let checked = false
  for (let i = 0; i < 200; i++) {
    // 화면(scene)은 연출이 끝나야 바뀐다. run 단계(phase)에 맞는 장면이 뜰 때까지 기다린다
    await page.waitForFunction(() => {
      const d = (window as unknown as { __duel?: DuelState }).__duel
      if (!d || d.animating) return false
      return (d.phase === 'battle' && d.scene === 'battle') || (d.phase === 'reward' && d.scene === 'reward') || d.scene === 'result' || d.phase === 'won' || d.phase === 'lost'
    })
    const s = (await state(page))!
    if (s.scene === 'result' || s.phase === 'lost' || s.phase === 'won') throw new Error(`웨이브 ${minWave} 전에 끝남 (${JSON.stringify(s)})`)
    if (s.phase === 'battle') {
      if (!checked && onBattle) {
        // onBattle은 마지막에 한 턴을 결정까지 진행한다. 연출이 시작·끝날 때까지 기다리고 상태를 다시 읽는다
        checked = true
        await onBattle()
        await page.waitForFunction(({ w, ph }) => {
          const d = (window as unknown as { __duel?: DuelState }).__duel
          return !!d && (d.animating || d.wave !== w || d.phase !== ph)
        }, { w: s.wave, ph: s.phase }, { timeout: 3000 }).catch(() => {})
        continue
      }
      if ((s.wave ?? 0) >= minWave) return
      // 한 번 누르면 고르기, 같은 명령을 다시 누르면 결정
      await btn(page, 'skill0').click()
      await btn(page, 'skill0').click()
    } else {
      await page.locator('[data-duel-btn=card0], [data-duel-btn=opt0]').first().click()
    }
    // 눌렀으니 상태가 바뀔 때까지(연출 시작·장면 전환) 기다린 뒤 다시 본다
    await page.waitForFunction(({ w, ph, an }) => {
      const d = (window as unknown as { __duel?: DuelState }).__duel
      return !!d && (d.wave !== w || d.phase !== ph || d.animating !== an)
    }, { w: s.wave, ph: s.phase, an: s.animating }, { timeout: 5000 }).catch(() => {})
  }
  throw new Error('웨이브에 도달하지 못함')
}

test.describe('데스크톱', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

  test('관우로 출진해 보상을 고르고 웨이브 3까지 간다', async ({ page }) => {
    const errors = trackErrors(page)
    await playTo(page, 3, async () => {
      await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveCount(0)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(over).toBeLessThanOrEqual(0)
      // 공격 기술은 유불리 말이 라벨에 붙고, 한 번 누르면 고르기(결정 단추 라벨이 그 명령으로 바뀐다)
      await expect(btn(page, 'skill0')).toHaveAttribute('aria-label', /유리|불리|비등/)
      await btn(page, 'skill0').click()
      await expect(btn(page, 'confirm')).toHaveAttribute('aria-label', /^결정: 일격/)
      await btn(page, 'confirm').click() // 결정 단추로도 결정된다
    })
    expect((await state(page))?.wave).toBeGreaterThanOrEqual(3)
    expect(errors).toEqual([])
  })
})

test.describe('모바일', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('명령 카드 44px 이상·가로 넘침 없음·탭바 숨김·웨이브 3까지', async ({ page }) => {
    const errors = trackErrors(page)
    await playTo(page, 3, async () => {
      await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveCount(0)
      const wrapper = await page.locator('canvas').first().evaluate((c) => {
        let el: HTMLElement | null = c.parentElement
        while (el && getComputedStyle(el).overflow !== 'hidden') el = el.parentElement
        return el ? { sw: el.scrollWidth, cw: el.clientWidth } : null
      })
      expect(wrapper).not.toBeNull()
      expect(wrapper!.sw).toBeLessThanOrEqual(wrapper!.cw)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(over).toBeLessThanOrEqual(0)
      for (const name of ['skill0', 'skill1', 'skill2', 'skill3', 'switch']) {
        const box = await btn(page, name).boundingBox()
        expect(box, name).not.toBeNull()
        expect(box!.height, name).toBeGreaterThanOrEqual(44)
      }
      // 미리보기 중(일격) 다른 명령(방어 태세)을 탭하면 결정이 아니라 고르기: 결정 단추가 방어 태세로 바뀌고 전투는 그대로
      await expect(btn(page, 'skill0')).toHaveAttribute('aria-label', /유리|불리|비등/)
      await btn(page, 'skill0').click()
      await expect(btn(page, 'confirm')).toHaveAttribute('aria-label', /^결정: 일격/)
      const before = await state(page)
      await btn(page, 'skill2').click()
      await expect(btn(page, 'confirm')).toHaveAttribute('aria-label', /^결정: 방어 태세/)
      expect(await state(page)).toMatchObject({ phase: 'battle', wave: before?.wave, animating: false })
      // 고른 명령을 다시 누르면 결정: 고른 줄이 비워지고 연출이 돈다
      await btn(page, 'skill2').click()
      await expect(btn(page, 'confirm')).toHaveAttribute('aria-label', /먼저 메뉴/)
    })
    expect(errors).toEqual([])
  })
})

test('공유 랜딩: 올바른 키는 200 + noindex', async ({ page }) => {
  const res = await page.goto('/samguk/duel/r/guanyu.lvbu.30.l.9')
  expect(res?.status()).toBe(200)
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
})

test('공유 랜딩: 잘못된 키는 게임으로 돌려보낸다', async ({ page }) => {
  await page.goto('/samguk/duel/r/bad')
  await expect(page).toHaveURL(/\/samguk\/duel$/)
})

test('열전 페이지: 보스는 "보스로 등장", 시작 장수는 시작 링크', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/samguk/duel/generals/lvbu')
  await expect(page.locator('h1').first()).toBeVisible()
  await expect(page.getByText('보스로 등장')).toBeVisible()
  await page.goto('/samguk/duel/generals/guanyu')
  await expect(page.getByRole('link', { name: '이 장수로 시작' })).toHaveAttribute('href', '/samguk/duel?me=guanyu')
  expect(errors).toEqual([])
})

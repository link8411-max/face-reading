import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { trackErrors } from './helpers'

const faces = [['public/dev-faces/person2.jpg', '여자'], ['public/dev-faces/person6.jpg', '남자'], ['public/dev-faces/person9.jpg', '여자']] as const
const has = faces.every(([f]) => existsSync(f))

test('우리 팀 삼국지: 3명 → 팀 카드(역할·별칭·STATUS), 공유 링크에는 별칭이 없다', async ({ page }) => {
  test.skip(!has, '개발용 얼굴 없음')
  const errors = trackErrors(page)
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: ShareData[] }
    w.__shared = []
    Object.assign(navigator, { canShare: () => true, share: async (d: ShareData) => { w.__shared.push({ text: d.text, url: d.url }) } })
  })
  await page.goto('/samguk/team')
  await page.getByRole('button', { name: '한 명 더' }).click()
  for (const [i, [file, g]] of faces.entries()) {
    const slot = page.getByRole('region', { name: `${i + 1}번 팀원` })
    await slot.getByRole('textbox', { name: `${i + 1}번 팀원 별칭` }).fill(`별칭${i + 1}`)
    await slot.getByRole('radio', { name: g }).click()
    await slot.locator('input[type=file]').setInputFiles(file)
  }
  await page.getByRole('button', { name: '우리 팀 결과 보기' }).click()
  const card = page.locator('article').first()
  await expect(card).toContainText(/우리 팀은 /, { timeout: 40000 })
  for (const w of ['군주', '책사', '선봉장', '별칭1', '팀 회사생활 STATUS', 'UNSE-AI.COM']) await expect(card).toContainText(w)
  await page.getByRole('button', { name: '공유하기' }).click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared[0]?.url ?? '')).toMatch(/\/samguk\/team\/r\/[a-z]+-[a-z]+-[a-z]+\?/)
  const sent = await page.evaluate(() => JSON.stringify((window as unknown as { __shared: ShareData[] }).__shared[0]))
  expect(sent).not.toContain('별칭')
  expect(errors).toEqual([])
})

test('팀 공유 링크: 미리보기 메타·검색 제외, 잘못된 값은 시작 화면, 미리보기 이미지', async ({ page, request }) => {
  await page.goto('/samguk/team/r/liubei-zhugeliang-guanyu')
  expect(await page.locator('meta[property="og:title"]').first().getAttribute('content')).toMatch(/^우리 팀은 .+! 너희 팀은 삼국지 속 누구야\?$/)
  expect(await page.locator('meta[name="robots"]').first().getAttribute('content')).toContain('noindex')
  await page.getByRole('link', { name: '우리 팀도 만들어 보기' }).click()
  await expect(page).toHaveURL(/\/samguk\/team$/)
  await page.goto('/samguk/team/r/liubei')
  await expect(page).toHaveURL(/\/samguk\/team$/)
  expect((await request.get('/api/og/result?kind=team&ids=liubei-zhugeliang-guanyu')).status()).toBe(200)
  expect((await request.get('/api/og/result?kind=team&ids=liubei-x')).status()).toBe(400)
})

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import CoupangBanner, { COUPANG_WIDGET_ID } from '@/components/CoupangBanner'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p] })
}

test('예전 고정 상품 배너(950676)를 더 쓰지 않는다', () => {
  for (const f of walk('src')) expect(readFileSync(f, 'utf8'), f).not.toContain('950676')
})

test('고객 관심 기반 추천 배너 + 페이지별 subId + 수수료 고지', () => {
  expect(COUPANG_WIDGET_ID).toBe(1043563)
  const html = renderToStaticMarkup(createElement(CoupangBanner, { subId: 'samguk' }))
  expect(html).toContain('id=1043563')
  expect(html).toContain('subId=samguk')
  expect(html).toContain('trackingCode=AF6497036')
  expect(html).toContain('쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다')
})

test.each([
  ['src/app/page.tsx', 'home'], ['src/app/face2/page.tsx', 'face'], ['src/app/animal/page.tsx', 'animal'],
  ['src/app/samguk/page.tsx', 'samguk'], ['src/app/fortune/FortuneClient.tsx', 'fortune'], ['src/app/fortune/daily/page.tsx', 'daily'],
])('%s 에 배너가 있다', (file, subId) => {
  expect(readFileSync(file, 'utf8')).toContain(`<CoupangBanner subId="${subId}"`)
})

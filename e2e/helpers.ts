import type { Page } from '@playwright/test'

export const PAGES = ['/', '/face2', '/animal', '/samguk', '/fortune', '/fortune/daily', '/about', '/privacy']
export const TEST_PAGES = ['/face2', '/animal', '/samguk', '/fortune', '/fortune/daily']

// 외부 광고·분석 스크립트 오류는 우리 코드 문제가 아니므로 제외
// MediaPipe(TFLite)는 정보 로그를 console.error로 찍는다
const IGNORED = /googlesyndication|adsbygoogle|_vercel\/insights|vercel-scripts|Failed to load resource|TensorFlow Lite XNNPACK/i

export function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  // 우리 사이트 파일(이미지·모델·청크)이 실패하면 오류로 센다 (콘솔의 'Failed to load resource'는 외부 광고 때문에 무시하므로)
  page.on('response', (r) => {
    // /_vercel/* 는 Vercel 배포 환경에서만 존재하므로 로컬 검사에서 제외
    if (r.url().startsWith('http://localhost:3200') && !r.url().includes('/_vercel/') && r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.test(m.text())) errors.push(`console: ${m.text()}`)
  })
  return errors
}

// 얼굴이 없는 단색 PNG (업로드 흐름 점검용)
export async function blankPng(page: Page): Promise<Buffer> {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 400; c.height = 400
    const x = c.getContext('2d')!
    x.fillStyle = '#88aacc'; x.fillRect(0, 0, 400, 400)
    return c.toDataURL('image/png').split(',')[1]
  })
  return Buffer.from(b64, 'base64')
}

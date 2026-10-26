import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import nextConfig from '../next.config'
import { SITEMAP_ROUTES } from '@/app/sitemap'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

test('/face는 /face2로 308', async () => {
  const redirects = await nextConfig.redirects!()
  expect(redirects).toContainEqual(expect.objectContaining({ source: '/face', destination: '/face2', permanent: true }))
})

test('sitemap에 /face가 없다', () => {
  expect(SITEMAP_ROUTES as readonly string[]).not.toContain('/face')
})

test('src 어디에도 generative-ai, GEMINI, href="/face" 가 없다', () => {
  for (const f of walk('src')) {
    const t = readFileSync(f, 'utf8')
    expect(t, f).not.toMatch(/generative-ai|GEMINI|href="\/face"/)
  }
})

test('package.json에 @google/generative-ai가 없다', () => {
  expect(readFileSync('package.json', 'utf8')).not.toContain('@google/generative-ai')
})

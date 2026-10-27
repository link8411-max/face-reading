import { renderToStaticMarkup } from 'react-dom/server'
import { handOffPhoto, takeHandedPhoto } from '@/lib/photoHandoff'
import NextTests from '@/components/result/NextTests'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

test('넘긴 사진은 한 번만 받을 수 있다', () => {
  handOffPhoto('data:image/jpeg;base64,AAA')
  expect(takeHandedPhoto()).toBe('data:image/jpeg;base64,AAA')
  expect(takeHandedPhoto()).toBeNull()
})

test('사진은 브라우저 저장소에 넣지 않는다', () => {
  const src = require('node:fs').readFileSync('src/lib/photoHandoff.ts', 'utf8')
  expect(src).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/)
})

test.each([
  ['samguk', ['/animal', '/face2'], '/samguk'],
  ['animal', ['/samguk', '/face2'], '/animal'],
  ['face', ['/samguk', '/animal'], '/face2'],
] as const)('%s 결과에는 다른 두 사진 테스트로 가는 카드만 있다', (current, hrefs, own) => {
  const html = renderToStaticMarkup(<NextTests current={current} image="data:x" />)
  for (const h of hrefs) expect(html).toContain(`href="${h}"`)
  expect(html).not.toContain(`href="${own}"`)
  expect(html).toContain('같은 사진으로')
  expect(html).toContain('no-screenshot')
})

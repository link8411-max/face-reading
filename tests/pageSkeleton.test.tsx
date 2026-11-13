import { renderToStaticMarkup } from 'react-dom/server'
import PageSkeleton from '@/components/PageSkeleton'

test('뼈대 화면은 스크린리더에 "불러오는 중"으로 읽히고 캡처에서 빠진다', () => {
  const html = renderToStaticMarkup(<PageSkeleton />)
  expect(html).toContain('role="status"')
  expect(html).toContain('aria-label="불러오는 중"')
  expect(html).toContain('no-screenshot')
})

test('뼈대의 반짝임은 움직임 줄이기 설정에서 꺼진다', () => {
  const css = require('node:fs').readFileSync('src/app/globals.css', 'utf8')
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*skeleton-shimmer/)
})

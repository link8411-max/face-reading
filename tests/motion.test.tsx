import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import AnalyzingOverlay from '@/components/test/AnalyzingOverlay'
import ResultCard from '@/components/result/ResultCard'

const css = readFileSync('src/app/globals.css', 'utf8')
test('분석 중 화면: 단계 문구와 캐릭터, 가짜 진행률 없음', () => {
  const html = renderToStaticMarkup(<AnalyzingOverlay cast="haetae" steps={['얼굴형 살피는 중', '복 자리 찾는 중']} step={1} />)
  expect(html).toContain('복 자리 찾는 중'); expect(html).toContain('/images/cast/haetae-face.webp')
  expect(html).toContain('role="status"'); expect(html).not.toMatch(/width:\s*\d+%/)
})
test('결과 카드는 캐릭터를 받으면 그 그림을 그린다', () => {
  const html = renderToStaticMarkup(<ResultCard eyebrow="나의 관상은" title="곳간이 든든한 상" reasons={[]} cast="haetae" />)
  expect(html).toContain('/images/cast/haetae.webp'); expect(html).toContain('reveal-card')
})
test('캡처 때 움직임을 끄는 규칙과 움직임 줄이기 규칙이 있다', () => {
  expect(css).toMatch(/\.motion-settled, \.motion-settled \*[^{]*\{[^}]*animation:\s*none !important/)
  expect(css).not.toMatch(/\.no-motion/)
  expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*reveal-card/)
  const cap = readFileSync('src/lib/capture.ts', 'utf8')
  expect(cap).toMatch(/getAnimations(\?\.)?\(\{ subtree: true \}\)/)
  expect(cap).toMatch(/classList\.add\('motion-settled'\)/)
  expect(cap).not.toMatch(/classList\.remove/) // 떼면 끝난 움직임이 다시 재생된다
  expect(cap).not.toMatch(/documentElement/)
})
test('캡처 훅은 움직임이 끝난 뒤 캡처 요소만 고정하고 찍는다', () => {
  expect(readFileSync('src/hooks/useScreenshot.ts', 'utf8')).toMatch(/settleMotion\(el\)\.then\(\(\) => domToBlob\(el/)
})
test('새로 더한 무한 반복 움직임은 분석 중 화면 것(scan·peek)뿐', () => {
  const names = [...css.matchAll(/animation:\s*([a-z0-9-]+)[^;]*infinite/g)].map((m) => m[1])
  const added = names.filter((n) => /scan|peek/.test(n))
  expect(added.sort()).toEqual(['peek-cast', 'scan-beam'])
  // 4단계 움직임 클래스(reveal·rise·press·tab-pop)에는 반복이 없다
  for (const cls of ['reveal-card', 'reveal-pop', 'rise', 'tab-pop']) {
    const m = css.match(new RegExp(`\\.${cls} \\{[^}]*\\}`))!
    expect(m[0], cls).not.toContain('infinite')
    expect(m[0], cls).toContain('both')
  }
})

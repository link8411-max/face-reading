import { readFileSync } from 'node:fs'

test('한글 글꼴(Noto Sans KR / Noto Serif KR)을 쓰고 Geist는 쓰지 않는다', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  expect(layout).toContain('Noto_Sans_KR')
  expect(layout).toContain('Noto_Serif_KR')
  expect(layout).not.toContain('Geist')
})

test('민화 현대화 색 토큰 8개', () => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  for (const [name, hex] of [['paper', '#FBF6EE'], ['paper-2', '#F3E9DA'], ['ink', '#3E2C23'], ['muted', '#8A7466'], ['vermilion', '#C8323E'], ['gold', '#C9A227'], ['navy', '#24426B'], ['line', '#E6D7C3']])
    expect(css, name).toContain(`--color-${name}: ${hex}`)
})

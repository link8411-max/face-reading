import { existsSync, statSync } from 'node:fs'
import { WISHES, FINISHES } from '@/lib/bujeok/keys'
import { WISH_TEXT, WISH_SLUG, exampleAlt, exampleSrc } from '@/content/bujeok'

test('소원 11개 모두 로마자 이름이 있고 서로 다르다', () => {
  expect(Object.keys(WISH_SLUG).sort()).toEqual([...WISHES].sort())
  expect(new Set(Object.values(WISH_SLUG)).size).toBe(11)
  for (const s of Object.values(WISH_SLUG)) expect(s).toMatch(/^[a-z]+(-[a-z]+)?$/)
})

test('예시 그림 설명: "<label> 부적 <hanja> <금박|종이> 잠금화면"', () => {
  expect(exampleAlt('pass', 'gold')).toBe('합격 부적 金榜題名 금박 잠금화면')
  expect(exampleAlt('money', 'paper')).toBe('재물 부적 招財進寶 종이 잠금화면')
  for (const w of WISHES) {
    expect(exampleAlt(w, 'gold')).toBe(`${WISH_TEXT[w].label} 부적 ${WISH_TEXT[w].hanja} 금박 잠금화면`)
  }
})

test('예시 그림 파일: 소원 11 × 종이·금박이 실제로 있고 가볍다', () => {
  for (const w of WISHES) {
    for (const f of ['paper', 'gold'] as const) {
      const src = exampleSrc(w, f)
      expect(src).toBe(`/bujeok/examples/${WISH_SLUG[w]}-bujeok-${f}.webp`)
      const file = `public${src}`
      expect(existsSync(file), file).toBe(true)
      expect(statSync(file).size, file).toBeLessThan(80_000)
    }
  }
  expect(FINISHES).toContain('holo') // holo는 정지 그림이 금박과 거의 같아 예시를 뽑지 않는다
  expect(statSync('public/bujeok/og-bujeok.png').size).toBeLessThan(400_000)
})

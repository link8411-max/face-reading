import { readFileSync } from 'node:fs'
import { mbtiArt, zodiacArt } from '@/lib/art'

test('mbtiArt·zodiacArt 경로 규칙', () => {
  expect(mbtiArt('ISFJ')).toEqual({ src: '/images/mbti/isfj.webp', face: '/images/mbti/isfj-face.webp' })
  expect(zodiacArt('dog', 'f')).toEqual({ src: '/images/zodiac/dog-f.webp', face: '/images/zodiac/dog-f-face.webp' })
  expect(zodiacArt('pig', 'm').face).toBe('/images/zodiac/pig-m-face.webp')
})

test('그림 스크립트는 파일 이름 규칙을 따르고 크롭 값은 webtoon-crops.json에만 있다', () => {
  const s = readFileSync('scripts/make-webtoon-images.mjs', 'utf8')
  expect(s).toContain('`mbti-${m}`')
  expect(s).toContain('`zodiac-${z}-${g}`')
  expect(s).toContain("sajaF: 'saja-f'")
  const crops = JSON.parse(readFileSync('scripts/webtoon-crops.json', 'utf8'))
  expect(crops['mbti-isfj']).toBeDefined()
  expect(crops['zodiac-dog-f']).toBeDefined()
  expect(crops['baksu']).toBeDefined()
})

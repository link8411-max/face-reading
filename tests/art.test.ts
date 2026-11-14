import { readFileSync } from 'node:fs'
import { mbtiArt, zodiacArt } from '@/lib/art'

test('mbtiArt·zodiacArt 경로 규칙', () => {
  expect(mbtiArt('ISFJ')).toEqual({ src: '/images/mbti/isfj.webp', face: '/images/mbti/isfj-face.webp' })
  expect(mbtiArt('ISFJ', 'm')).toEqual({ src: '/images/mbti/isfj-m.webp', face: '/images/mbti/isfj-m-face.webp' })
  expect(zodiacArt('dog', 'f')).toEqual({ src: '/images/zodiac/dog-f.webp', face: '/images/zodiac/dog-f-face.webp' })
  expect(zodiacArt('pig', 'm').face).toBe('/images/zodiac/pig-m-face.webp')
})

test('그림 스크립트는 파일 이름 규칙을 따르고 크롭 값은 webtoon-crops.json에만 있다', () => {
  const s = readFileSync('scripts/make-webtoon-images.mjs', 'utf8')
  expect(s).toContain('`mbti-${m}`')
  expect(s).toContain('`zodiac-${z}-${g}`')
  expect(s).toContain('`face-${k}-${g}`')
  expect(s).toContain("sajaF: 'saja-f'")
  const crops = JSON.parse(readFileSync('scripts/webtoon-crops.json', 'utf8'))
  expect(crops['mbti-isfj']).toBeDefined()
  expect(crops['zodiac-dog-f']).toBeDefined()
  expect(crops['baksu']).toBeDefined()
  expect(crops['face-earth-mid-f']).toBeDefined()
})

test('MBTI 처음 성별 표는 그림 스크립트와 같다(남 8·여 8)', async () => {
  const { MBTI_BASE_GENDER } = await import('@/lib/art')
  const s = readFileSync('scripts/make-webtoon-images.mjs', 'utf8')
  const m = s.match(/const MBTI_BASE_M = \[([^\]]+)\]/)![1].match(/[a-z]{4}/g)!
  const fromArt = Object.entries(MBTI_BASE_GENDER).filter(([, g]) => g === 'm').map(([t]) => t.toLowerCase())
  expect(m.sort()).toEqual(fromArt.sort())
  expect(fromArt).toHaveLength(8)
})

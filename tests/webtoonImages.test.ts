import { existsSync, statSync } from 'node:fs'
import sharp from 'sharp'
import { CAST } from '@/content/cast'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import { animalArt } from '@/lib/animal/art'

// 캐릭터 여섯 명과 동물상 13종 × 여·남 그림
const KEYS = Object.keys(CAST) as (keyof typeof CAST)[]

test.each(KEYS)('%s: 큰 그림 720×960, 얼굴 240×240, 미리보기 512×512', async (key) => {
  const c = CAST[key]
  for (const p of [c.img, c.face, c.og]) expect(existsSync(`public${p}`), p).toBe(true)
  const big = await sharp(`public${c.img}`).metadata()
  expect([big.width, big.height]).toEqual([720, 960])
  const face = await sharp(`public${c.face}`).metadata()
  expect([face.width, face.height]).toEqual([240, 240])
  const og = await sharp(`public${c.og}`).metadata()
  expect([og.width, og.height]).toEqual([512, 512])
  expect(statSync(`public${c.img}`).size).toBeLessThanOrEqual(160 * 1024)
  expect(statSync(`public${c.face}`).size).toBeLessThanOrEqual(30 * 1024)
})

const ANIMAL_ART = ANIMAL_KEYS.flatMap((k) => (['f', 'm'] as const).map((g) => [k, g] as const))

test.each(ANIMAL_ART)('동물상 %s-%s: 큰 그림 720×960, 얼굴 240×240', async (k, g) => {
  const a = animalArt(k, g)
  for (const p of [a.src, a.face]) expect(existsSync(`public${p}`), p).toBe(true)
  const big = await sharp(`public${a.src}`).metadata()
  expect([big.width, big.height]).toEqual([720, 960])
  const face = await sharp(`public${a.face}`).metadata()
  expect([face.width, face.height]).toEqual([240, 240])
  expect(statSync(`public${a.src}`).size).toBeLessThanOrEqual(160 * 1024)
  expect(statSync(`public${a.face}`).size).toBeLessThanOrEqual(30 * 1024)
})

test('animalArt 경로 규칙', () => {
  expect(animalArt('cat', 'm')).toEqual({ src: '/images/animal/cat-m.webp', face: '/images/animal/cat-m-face.webp' })
})

test('예전 동물상 그림(<키>.jpg)이 남아 있지 않다', () => {
  for (const k of ANIMAL_KEYS) expect(existsSync(`public/images/animal/${k}.jpg`), k).toBe(false)
})

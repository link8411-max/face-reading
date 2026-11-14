import { existsSync, statSync } from 'node:fs'
import sharp from 'sharp'
import { CAST } from '@/content/cast'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import { animalArt } from '@/lib/animal/art'
import { faceArt, mbtiArt, zodiacArt } from '@/lib/art'
import { GUANSANG_TYPE_KEYS } from '@/lib/face/guansangKeys'
import { MBTI_TYPES } from '@/lib/mbti/compat'
import { ZODIAC_SLUGS } from '@/content/fortune2027Zodiac'

// 캐릭터 아홉 명, 동물상 13종 × 여·남, MBTI 16유형, 띠 12 × 여·남 그림
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

async function checkArt(a: { src: string; face: string }) {
  for (const p of [a.src, a.face]) expect(existsSync(`public${p}`), p).toBe(true)
  const big = await sharp(`public${a.src}`).metadata()
  expect([big.width, big.height]).toEqual([720, 960])
  const face = await sharp(`public${a.face}`).metadata()
  expect([face.width, face.height]).toEqual([240, 240])
  expect(statSync(`public${a.src}`).size).toBeLessThanOrEqual(160 * 1024)
  expect(statSync(`public${a.face}`).size).toBeLessThanOrEqual(30 * 1024)
}

test.each(MBTI_TYPES)('MBTI %s: 큰 그림 720×960, 얼굴 240×240', async (t) => {
  await checkArt(mbtiArt(t))
})

const MBTI_ART = MBTI_TYPES.flatMap((t) => (['f', 'm'] as const).map((g) => [t, g] as const))
test.each(MBTI_ART)('MBTI %s 남녀 %s: 큰 그림 720×960, 얼굴 240×240', async (t, g) => {
  await checkArt(mbtiArt(t, g))
})

const ZODIAC_ART = ZODIAC_SLUGS.flatMap((z) => (['f', 'm'] as const).map((g) => [z, g] as const))
test.each(ZODIAC_ART)('띠 %s-%s: 큰 그림 720×960, 얼굴 240×240', async (z, g) => {
  await checkArt(zodiacArt(z, g))
})

const FACE_ART = GUANSANG_TYPE_KEYS.flatMap((k) => (['f', 'm'] as const).map((g) => [k, g] as const))
test.each(FACE_ART)('관상 %s-%s: 큰 그림 720×960, 얼굴 240×240', async (k, g) => {
  await checkArt(faceArt(k, g))
})

test('faceArt 경로 규칙', () => {
  expect(faceArt('earth-mid', 'm')).toEqual({ src: '/images/face/earth-mid-m.webp', face: '/images/face/earth-mid-m-face.webp' })
  expect(FACE_ART).toHaveLength(30)
})

import { existsSync, statSync } from 'node:fs'
import sharp from 'sharp'
import { CAST } from '@/content/cast'

// 캐릭터 그림(1차: 여섯 명). 동물상 26장과 animalArt는 2차.
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

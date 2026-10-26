import { readFileSync } from 'node:fs'
import { compressImage } from '@/lib/compressImage'
import { matchCharacter } from '@/lib/samguk/matcher'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'

test('디코딩할 수 없는 사진이면 compressImage가 reject한다 (무한 로딩 방지)', async () => {
  const g = globalThis as unknown as { Image: unknown }
  const original = g.Image
  g.Image = class {
    onload: (() => void) | null = null
    onerror: ((e: unknown) => void) | null = null
    set src(_v: string) { setTimeout(() => this.onerror?.(new Error('decode')), 0) }
  }
  try {
    await expect(compressImage('data:image/heic;base64,AAAA')).rejects.toBeTruthy()
  } finally {
    g.Image = original
  }
})

test('MediaPipe 패키지 버전이 CDN WASM 버전과 정확히 같다', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  const wasmVersion = readFileSync('src/lib/face/mediapipe.ts', 'utf8').match(/MEDIAPIPE_VERSION = "([^"]+)"/)![1]
  expect(pkg.dependencies['@mediapipe/tasks-vision']).toBe(wasmVersion)
})

test('홈 FAQ가 기준점 개수를 부풀리지 않는다', () => {
  expect(readFileSync('src/app/page.tsx', 'utf8')).not.toContain('수백 개')
})

test('사용자와 공유하는 특징이 없으면 닮은 이유가 특정 특징을 단정하지 않는다', () => {
  const zeros = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as ZVector
  const r = matchCharacter(zeros, '남')
  expect(r.matchReason).toContain('가장 가까워요')
  expect(r.matchReason).not.toMatch(/인상이 .+ 닮았어요/)
})

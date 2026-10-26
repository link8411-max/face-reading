import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'
import { matchCharacter, type Gender } from './matcher'

// 시드 고정 난수 (같은 시드면 같은 수열)
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 가상 얼굴: 특징마다 독립 표준정규분포(±3에서 자름).
// 실제 얼굴은 특징끼리 상관이 있지만 여기선 무시한 근사다. 실사진 통계가 쌓이면 바꿀 것.
export function sampleZ(rng: () => number): ZVector {
  const z = {} as ZVector
  for (const k of FEATURE_KEYS) {
    const u = Math.max(rng(), 1e-12), v = rng()
    const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    z[k] = Math.max(-3, Math.min(3, n))
  }
  return z
}

export function simulate(n: number, gender: Gender, bias: Record<string, number>, seed: number): Record<string, number> {
  const rng = mulberry32(seed)
  const counts: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const id = matchCharacter(sampleZ(rng), gender, bias).character.id
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

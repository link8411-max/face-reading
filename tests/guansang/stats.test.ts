import { describe, it, expect } from 'vitest'
import { GUANSANG_KEYS } from '@/lib/face/guansangFeatures'
import { GUANSANG_STATS_BY_GENDER, toZGuansang, sampleGuansang } from '@/lib/face/guansangStats'
import { Z_LIMIT } from '@/lib/face/featureStats'
import { mulberry32 } from '@/lib/face/sampleFeatures'

const GENDERS = ['여', '남'] as const

describe('guansangStats', () => {
  it('두 성별 모두 11개 키에 mean·std(>0)가 있다', () => {
    for (const g of GENDERS) for (const k of GUANSANG_KEYS) {
      const s = GUANSANG_STATS_BY_GENDER[g][k]
      expect(Number.isFinite(s.mean)).toBe(true)
      expect(s.std).toBeGreaterThan(0)
    }
  })
  it('평균 입력은 z=0, 극단 입력은 ±Z_LIMIT로 클램프', () => {
    for (const g of GENDERS) {
      const st = GUANSANG_STATS_BY_GENDER[g]
      const mean = Object.fromEntries(GUANSANG_KEYS.map((k) => [k, st[k].mean])) as never
      const z = toZGuansang(mean, g)
      for (const k of GUANSANG_KEYS) expect(z[k]).toBeCloseTo(0, 9)
      const hi = Object.fromEntries(GUANSANG_KEYS.map((k) => [k, st[k].mean + 100 * st[k].std])) as never
      const lo = Object.fromEntries(GUANSANG_KEYS.map((k) => [k, st[k].mean - 100 * st[k].std])) as never
      for (const k of GUANSANG_KEYS) {
        expect(toZGuansang(hi, g)[k]).toBe(Z_LIMIT)
        expect(toZGuansang(lo, g)[k]).toBe(-Z_LIMIT)
      }
    }
  })
  it('sampleGuansang: zone 합 1, 특징 평균이 stats.mean ± 0.1·std', () => {
    for (const g of GENDERS) {
      const rng = mulberry32(7), N = 1000
      const sum: Record<string, number> = Object.fromEntries(GUANSANG_KEYS.map((k) => [k, 0]))
      for (let i = 0; i < N; i++) {
        const f = sampleGuansang(rng, g)
        expect(f.zoneUp + f.zoneMid + f.zoneDown).toBeCloseTo(1, 9)
        for (const k of GUANSANG_KEYS) sum[k] += f[k]
      }
      for (const k of GUANSANG_KEYS) {
        const { mean, std } = GUANSANG_STATS_BY_GENDER[g][k]
        expect(Math.abs(sum[k] / N - mean)).toBeLessThanOrEqual(0.1 * std)
      }
    }
  })
})

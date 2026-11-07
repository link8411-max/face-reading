import { simulateGuansang } from '@/lib/face/guansangSimulate'
import { GUANSANG_TYPE_KEYS, SHAPE_KEYS, ZONE_KEYS } from '@/lib/face/guansangKeys'
import calibration from '@/lib/face/guansangCalibration.json'

const N = 8000
const cal = calibration as any

test.each(['남', '여'] as const)('%s: 15유형이 모두 나오고 균등의 3배를 넘지 않는다', (g) => {
  for (const seed of [cal.seed, 777]) {
    const counts = simulateGuansang(N, g, cal, seed)
    const check = (keys: string[], pick: (t: string) => string) => {
      const uniform = N / keys.length
      for (const k of keys) {
        const c = GUANSANG_TYPE_KEYS.filter((t) => pick(t) === k).reduce((s, t) => s + (counts[t] ?? 0), 0)
        expect(c, `${g} ${seed} ${k}`).toBeGreaterThanOrEqual(1)
        expect(c / uniform, `${g} ${seed} ${k}`).toBeLessThanOrEqual(3)
      }
    }
    check([...GUANSANG_TYPE_KEYS], (t) => t)
    check([...SHAPE_KEYS], (t) => t.split('-')[0])
    check([...ZONE_KEYS], (t) => t.split('-')[1])
  }
})

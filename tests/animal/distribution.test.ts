import { simulateAnimal } from '@/lib/animal/simulate'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import calibration from '@/lib/animal/calibration.json'

const N = 8000
const uniform = N / ANIMAL_KEYS.length

test.each(['남', '여'] as const)('%s: 동물상 8종이 모두 나오고 균등의 3배를 넘지 않는다', (g) => {
  for (const seed of [calibration.seed, 777]) {
    const counts = simulateAnimal(N, g, calibration.bias, seed)
    for (const k of ANIMAL_KEYS) {
      expect(counts[k] ?? 0, `${g} ${seed} ${k}`).toBeGreaterThanOrEqual(1)
      expect((counts[k] ?? 0) / uniform, `${g} ${seed} ${k}`).toBeLessThanOrEqual(3)
    }
  }
})

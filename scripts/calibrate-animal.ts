// 동물상 쏠림 보정: 두 성별 시뮬레이션을 합쳐 동물상별 bias를 구해 calibration.json에 기록
// (z는 성별 기준으로 맞춰져 있어 두 성별의 분포가 같으므로 bias는 하나로 둔다)
// 실행: npx tsx --tsconfig tsconfig.json scripts/calibrate-animal.ts
import { writeFileSync } from 'node:fs'
import { simulateAnimal } from '../src/lib/animal/simulate'
import { ANIMAL_KEYS } from '../src/lib/animal/matcher'

const SEED = 20261026
const N = 8000
const STEP = 0.15
const bias: Record<string, number> = Object.fromEntries(ANIMAL_KEYS.map((k) => [k, 0]))
const uniform = (2 * N) / ANIMAL_KEYS.length
let rates: number[] = []
for (let iter = 0; iter < 200; iter++) {
  const a = simulateAnimal(N, '여', bias, SEED), b = simulateAnimal(N, '남', bias, SEED + 1)
  rates = ANIMAL_KEYS.map((k) => ((a[k] ?? 0) + (b[k] ?? 0)) / uniform)
  if (rates.every((r) => r >= 0.7 && r <= 1.4)) break
  ANIMAL_KEYS.forEach((k, i) => (bias[k] += STEP * Math.log(Math.max(rates[i], 0.05))))
}
console.log(ANIMAL_KEYS.map((k, i) => `${k} ${rates[i].toFixed(2)}x`).join(', '))
const rounded = Object.fromEntries(Object.entries(bias).map(([k, v]) => [k, Math.round(v * 1000) / 1000]))
writeFileSync('src/lib/animal/calibration.json', JSON.stringify({ seed: SEED, n: N, bias: rounded }, null, 2) + '\n')

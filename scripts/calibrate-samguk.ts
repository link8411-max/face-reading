// 삼국지 쏠림 보정: 시뮬레이션으로 인물별 bias를 구해 calibration.json에 기록
// 실행: npx tsx --tsconfig tsconfig.json scripts/calibrate-samguk.ts
import { writeFileSync } from 'node:fs'
import { simulate } from '../src/lib/samguk/simulate'
import { samgukCharacters } from '../src/lib/samgukDB'

const SEED = 20261026
const N = 10000
const MAX_ITER = 200
const STEP = 0.15

const bias: Record<string, number> = {}
for (const gender of ['남', '여'] as const) {
  const ids = samgukCharacters.filter((c) => c.gender === gender).map((c) => c.id)
  ids.forEach((id) => (bias[id] = 0))
  const uniform = N / ids.length
  let rates: number[] = []
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const counts = simulate(N, gender, bias, SEED)
    rates = ids.map((id) => (counts[id] ?? 0) / uniform)
    // 스펙 기준(1회 이상, 3배 이하)보다 엄격하게: 0.3배~2배 안에 들면 종료
    const done = rates.every((r) => r >= 0.3 && r <= 2)
    if (done) break
    ids.forEach((id, i) => (bias[id] += STEP * Math.log(Math.max(rates[i], 0.05))))
  }
  console.log(`${gender}: max ${Math.max(...rates).toFixed(2)}x, min ${Math.min(...rates).toFixed(2)}x, 0회 ${rates.filter((r) => r === 0).length}명`)
}

const rounded = Object.fromEntries(Object.entries(bias).map(([k, v]) => [k, Math.round(v * 1000) / 1000]))
writeFileSync('src/lib/samguk/calibration.json', JSON.stringify({ seed: SEED, n: N, bias: rounded }, null, 2) + '\n')

// 관상 쏠림 보정: 얼굴형 bias(5)와 센 자리 bias(3)를 번갈아 갱신해 15유형·주변분포를 0.7~1.4배로 맞춘다
// 실행: npx tsx --tsconfig tsconfig.json scripts/calibrate-guansang.ts
import { writeFileSync } from 'node:fs'
import { simulateGuansang } from '../src/lib/face/guansangSimulate'
import { GUANSANG_TYPE_KEYS, SHAPE_KEYS, ZONE_KEYS } from '../src/lib/face/guansangKeys'
import type { Calibration } from '../src/lib/face/guansang'

const SEED = 20261107
const N = 8000
const STEP = 0.15
const cal: Calibration = {
  seed: SEED, n: N,
  shapeBias: Object.fromEntries(SHAPE_KEYS.map((k) => [k, 0])) as Calibration['shapeBias'],
  zoneBias: Object.fromEntries(ZONE_KEYS.map((k) => [k, 0])) as Calibration['zoneBias'],
}
const inRange = (r: number) => r >= 0.7 && r <= 1.4

function measure() {
  const a = simulateGuansang(N, '여', cal, SEED), b = simulateGuansang(N, '남', cal, SEED + 1)
  const c = (k: string) => (a[k] ?? 0) + (b[k] ?? 0)
  const typeRates = GUANSANG_TYPE_KEYS.map((k) => c(k) / ((2 * N) / 15))
  const shapeRates = SHAPE_KEYS.map((s) => GUANSANG_TYPE_KEYS.filter((k) => k.startsWith(s + '-')).reduce((t, k) => t + c(k), 0) / ((2 * N) / 5))
  const zoneRates = ZONE_KEYS.map((z) => GUANSANG_TYPE_KEYS.filter((k) => k.endsWith('-' + z)).reduce((t, k) => t + c(k), 0) / ((2 * N) / 3))
  return { typeRates, shapeRates, zoneRates }
}

let m = measure()
for (let iter = 0; iter < 300; iter++) {
  if ([...m.typeRates, ...m.shapeRates, ...m.zoneRates].every(inRange)) break
  if (iter % 2 === 0) SHAPE_KEYS.forEach((k, i) => (cal.shapeBias[k] += STEP * Math.log(Math.max(m.shapeRates[i], 0.05))))
  else ZONE_KEYS.forEach((k, i) => (cal.zoneBias[k] -= STEP * Math.log(Math.max(m.zoneRates[i], 0.05))))
  m = measure()
}
// shape은 거리(작을수록 선택)라 + 방향, zone은 z 점수(클수록 선택)라 - 방향으로 갱신한다
console.log('15키', GUANSANG_TYPE_KEYS.map((k, i) => `${k} ${m.typeRates[i].toFixed(2)}x`).join(', '))
console.log('shape', SHAPE_KEYS.map((k, i) => `${k} ${m.shapeRates[i].toFixed(2)}x`).join(', '))
console.log('zone', ZONE_KEYS.map((k, i) => `${k} ${m.zoneRates[i].toFixed(2)}x`).join(', '))
const round = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 1000) / 1000]))
writeFileSync('src/lib/face/guansangCalibration.json', JSON.stringify({ seed: SEED, n: N, shapeBias: round(cal.shapeBias), zoneBias: round(cal.zoneBias) }, null, 2) + '\n')

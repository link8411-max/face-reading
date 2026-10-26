import { simulate } from '@/lib/samguk/simulate'
import calibration from '@/lib/samguk/calibration.json'
import { samgukCharacters } from '@/lib/samgukDB'

const N = 10000
const candidates = (g: '남' | '여') => samgukCharacters.filter((c) => c.gender === g).map((c) => c.id)

test.each(['남', '여'] as const)('%s: 모든 인물이 1회 이상 나온다', (g) => {
  const counts = simulate(N, g, calibration.bias, calibration.seed)
  for (const id of candidates(g)) expect(counts[id] ?? 0, id).toBeGreaterThanOrEqual(1)
})

test.each(['남', '여'] as const)('%s: 어떤 인물도 균등의 3배를 넘지 않는다', (g) => {
  const counts = simulate(N, g, calibration.bias, calibration.seed)
  const uniform = N / candidates(g).length
  for (const id of candidates(g)) expect((counts[id] ?? 0) / uniform, id).toBeLessThanOrEqual(3)
})

test('보정 전 쏠림 기록 (보정 효과 근거, 실패 조건 아님)', () => {
  for (const g of ['남', '여'] as const) {
    const counts = simulate(N, g, {}, calibration.seed)
    const uniform = N / candidates(g).length
    const rates = candidates(g).map((id) => (counts[id] ?? 0) / uniform)
    console.info(`${g} 보정 전: max ${Math.max(...rates).toFixed(2)}x, min ${Math.min(...rates).toFixed(2)}x, 0회 ${rates.filter((r) => r === 0).length}명`)
  }
})

test.each(['남', '여'] as const)('%s: 보정 시드가 아닌 다른 시드에서도 기준을 지킨다', (g) => {
  const counts = simulate(N, g, calibration.bias, 777)
  const uniform = N / candidates(g).length
  for (const id of candidates(g)) {
    expect(counts[id] ?? 0, id).toBeGreaterThanOrEqual(1)
    expect((counts[id] ?? 0) / uniform, id).toBeLessThanOrEqual(3)
  }
})

import { expect, test } from 'vitest'
import { revealPlan, type StrokeIn } from '@/lib/bujeok/timeline'

const mk = (draw: number, pop: number, fade: number): StrokeIn[] => [
  ...Array.from({ length: draw }, (_, i) => ({ kind: 'draw' as const, length: 60 + i * 7 })),
  ...Array.from({ length: pop }, () => ({ kind: 'pop' as const })),
  ...Array.from({ length: fade }, () => ({ kind: 'fade' as const })),
  { kind: 'stamp' as const },
]

test('reduced면 모든 단계 delay 0·duration 0, total 0', () => {
  const p = revealPlan(mk(10, 3, 2), true)
  expect(p.total).toBe(0)
  expect(p.steps).toHaveLength(16)
  for (const s of p.steps) expect(s).toEqual({ delay: 0, duration: 0 })
})

test('단계는 순서대로 시작한다(delay 비내림차순)', () => {
  const { steps } = revealPlan(mk(12, 4, 3), false)
  for (let i = 1; i < steps.length; i++) expect(steps[i].delay).toBeGreaterThanOrEqual(steps[i - 1].delay)
  expect(steps[0].delay).toBe(0)
})

test('total은 5000~8000ms 사이로 맞춰진다 — 선이 아주 적거나 많아도', () => {
  const few = mk(2, 0, 0)
  const many = mk(200, 80, 40)
  expect(revealPlan(few, false).total).toBeGreaterThanOrEqual(5000)
  expect(revealPlan(few, false).total).toBeLessThanOrEqual(8000)
  expect(revealPlan(many, false).total).toBeGreaterThanOrEqual(5000)
  expect(revealPlan(many, false).total).toBeLessThanOrEqual(8000)
  const mid = revealPlan(mk(25, 6, 5), false).total
  expect(mid).toBeGreaterThanOrEqual(5000)
  expect(mid).toBeLessThanOrEqual(8000)
})

test('stamp는 항상 마지막 400ms 안에 끝난다', () => {
  for (const s of [mk(2, 0, 0), mk(25, 6, 5), mk(200, 80, 40), [{ kind: 'stamp' as const }]]) {
    const p = revealPlan(s, false)
    const last = p.steps[p.steps.length - 1]
    const end = last.delay + last.duration
    expect(end).toBeLessThanOrEqual(p.total + 1)
    expect(end).toBeGreaterThanOrEqual(p.total - 400)
  }
})

test('모든 단계가 total 안에 끝나고 duration은 양수다', () => {
  const p = revealPlan(mk(40, 10, 8), false)
  for (const s of p.steps) {
    expect(s.duration).toBeGreaterThan(0)
    expect(s.delay + s.duration).toBeLessThanOrEqual(p.total + 1)
  }
})

test('선이 없으면 빈 계획', () => {
  expect(revealPlan([], false)).toEqual({ steps: [], total: 0 })
})

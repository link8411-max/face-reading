// 부적이 그려지는 일정. 순수 함수: 요소 목록(그리는 순서)을 받아 요소마다 시작 시각과 길이를 돌려준다.
import type { StrokeKind } from '@/components/bujeok/parts/types'

export interface StrokeIn { kind: StrokeKind; length?: number; /** data-d 같은 원하는 길이(ms). 있으면 length보다 우선 */ preferred?: number }
export interface StrokeOut { delay: number; duration: number }

export const REVEAL_MIN = 5000
export const REVEAL_MAX = 8000
const STAMP_MS = 400

function baseMs(s: StrokeIn): number {
  if (s.kind === 'stamp') return STAMP_MS
  if (s.kind === 'pop') return 110
  if (s.kind === 'fade') return 200
  if (s.preferred && s.preferred > 0) return s.preferred
  return 80 + (s.length && s.length > 0 ? s.length : 100) * 3
}

/**
 * 모든 단계를 차례로 놓고, 도장을 뺀 나머지를 늘이거나 줄여 전체가 5~8초가 되게 한다.
 * 도장은 400ms로 고정이고 가장 마지막에 끝난다. reduced면 전부 0.
 */
export function revealPlan(strokes: StrokeIn[], reduced: boolean): { steps: StrokeOut[]; total: number } {
  if (reduced) return { steps: strokes.map(() => ({ delay: 0, duration: 0 })), total: 0 }
  if (strokes.length === 0) return { steps: [], total: 0 }
  const base = strokes.map(baseMs)
  const fixed = strokes.reduce((a, s, i) => a + (s.kind === 'stamp' ? base[i] : 0), 0)
  const flex = base.reduce((a, b, i) => a + (strokes[i].kind === 'stamp' ? 0 : b), 0)
  const total = Math.min(REVEAL_MAX, Math.max(REVEAL_MIN, flex + fixed))
  const scale = flex > 0 ? (total - fixed) / flex : 0
  const steps: StrokeOut[] = []
  let t = 0
  strokes.forEach((s, i) => {
    const duration = s.kind === 'stamp' ? base[i] : Math.max(1, base[i] * scale)
    steps.push({ delay: Math.round(t), duration: Math.round(duration) })
    t += duration
  })
  if (flex === 0) {
    // 도장만 있으면 마지막에 찍는다
    const last = steps[steps.length - 1]
    last.delay = total - last.duration
  }
  return { steps, total }
}

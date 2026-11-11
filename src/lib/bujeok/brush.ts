// 붓 획 라이브러리: 점들을 부드럽게 이어 눌렀다 떼는 굵기를 준 채운 도형(path d)으로 만든다.
// 시안 docs/bujeok/serious/art.js의 함수를 그대로 옮겼다. 난수는 시드 고정(Math.random 금지).
export type Pt = [number, number]

export function rng(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface BrushOpts {
  seed?: number
  /** 시작 눌림(0~1.15), 끝 가늘기 */
  start?: number
  end?: number
}

/** 붓 획. w는 가장 굵을 때의 굵기 기준값 */
export function brush(pts: Pt[], w: number, o: BrushOpts = {}): string {
  const r = rng(o.seed ?? 1)
  const start = o.start ?? 0.45
  const end = o.end ?? 0.1
  const s: Pt[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const n = Math.max(6, (Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.5) | 0)
    for (let k = 0; k < n; k++) {
      const t = k / n
      const t2 = t * t
      const t3 = t2 * t
      const c = (d: 0 | 1) =>
        0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)
      s.push([c(0), c(1)])
    }
  }
  s.push(pts[pts.length - 1])
  const L: Pt[] = []
  const R: Pt[] = []
  const N = s.length
  let jit = 1
  for (let i = 0; i < N; i++) {
    const a = s[Math.max(0, i - 1)]
    const b = s[Math.min(N - 1, i + 1)]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const t = i / (N - 1)
    let f = t < 0.07 ? start + (1.15 - start) * (t / 0.07) : t > 0.82 ? 1 - (1 - end) * ((t - 0.82) / 0.18) : 1.15 - 0.2 * Math.sin((Math.PI * (t - 0.07)) / 0.75)
    f *= 0.62 + 0.42 * Math.abs(dy / len) // 가로획은 얇게, 세로획은 굵게
    jit += (r() - 0.5) * 0.08
    jit = Math.min(1.08, Math.max(0.92, jit))
    const hw = (w * f * jit) / 2
    const nx = -dy / len
    const ny = dx / len
    L.push([s[i][0] + nx * hw, s[i][1] + ny * hw])
    R.push([s[i][0] - nx * hw, s[i][1] - ny * hw])
  }
  const f2 = (p: Pt) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)
  const hwEnd = Math.hypot(L[N - 1][0] - R[N - 1][0], L[N - 1][1] - R[N - 1][1]) / 2
  const hwStart = Math.hypot(L[0][0] - R[0][0], L[0][1] - R[0][1]) / 2
  return (
    'M' + L.map(f2).join(' L') + ` A${hwEnd.toFixed(1)} ${hwEnd.toFixed(1)} 0 0 1 ` + R.slice().reverse().map(f2).join(' L') + ` A${hwStart.toFixed(1)} ${hwStart.toFixed(1)} 0 0 1 ${f2(L[0])} Z`
  )
}

export const circlePts = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt
  })

/** 손으로 그은 듯 살짝 어긋난 네모 */
export const box = (x: number, y: number, s: number): Pt[] => [[x, y], [x + s, y + 1], [x + s - 1, y + s], [x + 1, y + s - 1], [x + 1, y + 3]]

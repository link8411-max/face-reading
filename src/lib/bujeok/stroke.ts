// 사용자가 긋는 마지막 한 획(몸통). 좌표는 시안과 같은 240×508 종이 좌표다.
// 링크 코드에는 12점으로 줄여 25자('s' + 24글자)로 싣는다.
import type { Pt } from './brush'

/** 시안 STROKES[12]: 길게 내려와 왼쪽으로 꺾어 올리는 몸통 */
export const DEFAULT_SPINE: Pt[] = [[120, 254], [121, 300], [119, 360], [121, 410], [118, 438], [104, 450], [92, 440]]

export const SPINE_W = 8 * 1.75
export const SPINE_BRUSH = { start: 0.6, end: 0.12, seed: 99 } as const
export const PAPER_W = 240
export const PAPER_H = 508

/** 손 획을 가운데 줄 쪽으로 살짝 당긴다. 아래 꺾임(y 432 아래)은 손 그대로 */
export function tame([x, y]: Pt): Pt {
  if (y < 432) {
    const d = Math.max(-14, Math.min(14, (x - 120) * 0.4))
    return [120 + d, y]
  }
  return [x, y]
}

/** 완성으로 칠 수 있는 획인가: 점 6개 이상, 위(y≤280)에서 시작해 아래(y≥405)까지, 전부 종이 안 */
export function isComplete(pts: Pt[]): boolean {
  if (pts.length < 6) return false
  if (pts[0][1] > 280) return false
  if (pts[pts.length - 1][1] < 405) return false
  return pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= PAPER_W && y >= 0 && y <= PAPER_H)
}

/** 호 길이 기준 등간격 n점 */
export function resample(pts: Pt[], n = 12): Pt[] {
  if (pts.length === 0) return []
  if (pts.length === 1) return Array.from({ length: n }, () => [pts[0][0], pts[0][1]] as Pt)
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = cum[cum.length - 1]
  const out: Pt[] = []
  let j = 1
  for (let k = 0; k < n; k++) {
    const d = (total * k) / (n - 1)
    while (j < pts.length - 1 && cum[j] < d) j++
    const seg = cum[j] - cum[j - 1]
    const t = seg > 0 ? (d - cum[j - 1]) / seg : 0
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t])
  }
  return out
}

const B36 = '0123456789abcdefghijklmnopqrstuvwxyz'
const cell = (v: number) => B36[Math.max(0, Math.min(35, Math.round(v)))]

export function encodeStroke(pts: Pt[]): string {
  return 's' + resample(pts, 12).map(([x, y]) => cell((x - 84) / 2) + cell((y - 250) / 6)).join('')
}

export const STROKE_RE = /^s[0-9a-z]{24}$/

export function decodeStroke(s: string): Pt[] | null {
  if (!STROKE_RE.test(s)) return null
  const out: Pt[] = []
  for (let i = 0; i < 12; i++) out.push([84 + B36.indexOf(s[1 + i * 2]) * 2, 250 + B36.indexOf(s[2 + i * 2]) * 6])
  return out
}

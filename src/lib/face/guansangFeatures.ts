// 관상 전용 얼굴 특징 11개 (MediaPipe 478점 → 비율/각도)
// 두 눈을 수평으로 맞춘 좌표(aligned)에서 재므로 크기·위치·기울기에 불변이다.
// 좌우 쌍은 한쪽만 보지 않고 중심선 기준 반폭의 평균으로 재서, 살짝 돌린 사진의 비대칭에 덜 흔들린다.
import { aligned, type Landmark } from './landmarkFeatures'

export const GUANSANG_KEYS = [
  'cheekWidth', 'jawCheekRatio', 'jawAngle', 'chinTaper', 'foreheadWidth',
  'zoneUp', 'zoneMid', 'zoneDown', 'browInnerGap', 'browLength', 'eyeCornerToEdge',
] as const
export type GuansangKey = typeof GUANSANG_KEYS[number]
export type GuansangFeatureVector = Record<GuansangKey, number>

// 상정(이마) 비율이 이 범위 밖이면 앞머리 등으로 이마 위쪽이 불확실하다고 본다. 2026-11-07 실측 zoneUp 0.1219~0.1962(n=20)에 범위의 20%씩 여유.
export const ZONE_UP_RANGE = { min: 0.107, max: 0.211 }

type P = [number, number]
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1])
const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// 꼭짓점 b에서 a-b-c가 이루는 각(도)
function angleDeg(a: P, b: P, c: P): number {
  const v1: P = [a[0] - b[0], a[1] - b[1]], v2: P = [c[0] - b[0], c[1] - b[1]]
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}

export function extractGuansangFeatures(lm: Landmark[]): GuansangFeatureVector {
  const p = aligned(lm)
  // 좌우 쌍 너비: 얼굴 중심선(이마 끝~턱 끝) 기준 양쪽 반폭의 평균 x 2
  const axisX = (p(10)[0] + p(152)[0]) / 2
  const pairWidth = (l: number, r: number) =>
    (Math.abs(axisX - p(l)[0]) + Math.abs(p(r)[0] - axisX)) // = 두 반폭의 평균 x 2

  const faceW = dist(p(234), p(454))
  const iod = dist(p(133), p(362))

  const cheekW = pairWidth(116, 345)
  const jawW = pairWidth(172, 397)
  const browMid = mid(p(105), p(334))
  const nose = p(1)

  // 세로 구역은 정렬 좌표의 y 차이로 재서 세 값의 합이 항상 1이다 (실제 랜드마크가 일직선이 아니어도)
  const spanY = p(152)[1] - p(10)[1]
  const up = (browMid[1] - p(10)[1]) / spanY
  const midZ = (nose[1] - browMid[1]) / spanY
  const down = (p(152)[1] - nose[1]) / spanY

  return {
    cheekWidth: cheekW / faceW,
    jawCheekRatio: jawW / cheekW,
    jawAngle: angleDeg(p(172), p(152), p(397)),
    chinTaper: pairWidth(148, 377) / jawW,
    foreheadWidth: pairWidth(54, 284) / faceW,
    zoneUp: up,
    zoneMid: midZ,
    zoneDown: down,
    browInnerGap: dist(p(107), p(336)) / iod,
    browLength: (dist(p(70), p(107)) + dist(p(300), p(336))) / 2 / iod,
    eyeCornerToEdge: (dist(p(33), p(234)) + dist(p(263), p(454))) / 2 / faceW,
  }
}

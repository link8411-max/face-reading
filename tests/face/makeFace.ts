import type { Landmark } from '@/lib/face/landmarkFeatures'

// 테스트용 가상 정면 얼굴: 특징 계산에 쓰는 인덱스만 좌표를 채운 478개 랜드마크
export const BASE_POINTS: Record<number, [number, number]> = {
  33: [-45, 0], 133: [-15, 0], 362: [15, 0], 263: [45, 0],
  159: [-30, -6], 145: [-30, 6], 386: [30, -6], 374: [30, 6],
  70: [-50, -20], 105: [-30, -24], 107: [-12, -20],
  300: [50, -20], 334: [30, -24], 336: [12, -20],
  168: [0, -10], 1: [0, 40], 129: [-14, 38], 358: [14, 38],
  61: [-24, 65], 291: [24, 65], 0: [0, 58], 13: [0, 62], 14: [0, 68], 17: [0, 74],
  10: [0, -70], 152: [0, 110], 234: [-70, 20], 454: [70, 20], 172: [-55, 85], 397: [55, 85],
}

export interface FaceOpts {
  scale?: number
  dx?: number
  dy?: number
  rotateDeg?: number
  edit?: (p: Record<number, [number, number]>) => void
}

export function makeFace(opts: FaceOpts = {}): Landmark[] {
  const { scale = 1, dx = 0, dy = 0, rotateDeg = 0, edit } = opts
  const pts: Record<number, [number, number]> = Object.fromEntries(
    Object.entries(BASE_POINTS).map(([k, v]) => [k, [v[0], v[1]]]),
  )
  edit?.(pts)
  const r = (rotateDeg * Math.PI) / 180
  const out: Landmark[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }))
  for (const [k, [x, y]] of Object.entries(pts)) {
    const rx = x * Math.cos(r) - y * Math.sin(r)
    const ry = x * Math.sin(r) + y * Math.cos(r)
    out[Number(k)] = { x: rx * scale + dx, y: ry * scale + dy, z: 0 }
  }
  return out
}

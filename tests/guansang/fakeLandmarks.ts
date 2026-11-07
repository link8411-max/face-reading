import type { Landmark } from '@/lib/face/landmarkFeatures'

// 정면 얼굴을 흉내 낸 기본 좌표 (두 눈 수평, 좌우 대칭). 쓰는 인덱스만 의미 있는 값이다.
const BASE: Record<number, { x: number; y: number }> = {
  10: { x: 0.5, y: 0.15 }, 152: { x: 0.5, y: 0.85 },
  234: { x: 0.2, y: 0.45 }, 454: { x: 0.8, y: 0.45 },
  116: { x: 0.23, y: 0.5 }, 345: { x: 0.77, y: 0.5 },
  172: { x: 0.3, y: 0.72 }, 397: { x: 0.7, y: 0.72 },
  148: { x: 0.44, y: 0.82 }, 377: { x: 0.56, y: 0.82 },
  54: { x: 0.3, y: 0.2 }, 284: { x: 0.7, y: 0.2 },
  105: { x: 0.38, y: 0.34 }, 334: { x: 0.62, y: 0.34 },
  1: { x: 0.5, y: 0.55 }, 168: { x: 0.5, y: 0.4 },
  107: { x: 0.45, y: 0.35 }, 336: { x: 0.55, y: 0.35 },
  70: { x: 0.3, y: 0.35 }, 300: { x: 0.7, y: 0.35 },
  133: { x: 0.45, y: 0.42 }, 362: { x: 0.55, y: 0.42 },
  33: { x: 0.3, y: 0.42 }, 263: { x: 0.7, y: 0.42 },
  129: { x: 0.46, y: 0.58 }, 358: { x: 0.54, y: 0.58 },
  61: { x: 0.43, y: 0.68 }, 291: { x: 0.57, y: 0.68 },
  0: { x: 0.5, y: 0.65 }, 13: { x: 0.5, y: 0.675 }, 14: { x: 0.5, y: 0.685 }, 17: { x: 0.5, y: 0.72 },
  159: { x: 0.36, y: 0.405 }, 145: { x: 0.36, y: 0.435 },
  386: { x: 0.64, y: 0.405 }, 374: { x: 0.64, y: 0.435 },
}

export function fakeLandmarks(overrides: Partial<Record<number, { x: number; y: number }>> = {}): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }))
  for (const [i, v] of Object.entries(BASE)) lm[Number(i)] = { ...v }
  for (const [i, v] of Object.entries(overrides)) if (v) lm[Number(i)] = { ...v }
  return lm
}

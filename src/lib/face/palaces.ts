// 자리 5곳 판독: 특징 z 평균으로 라벨(두드러진/고른/가꿀수록 자라는)을 붙인다.
import type { ZVector } from './featureStats'
import type { GuansangZ } from './guansangStats'
import { PALACE_KEYS, type PalaceKey, type PalaceLabel } from './guansangKeys'

export interface PalaceResult { key: PalaceKey; label: PalaceLabel; z: number }

const T = 0.5
const avg = (a: number, b: number) => (a + b) / 2

export function readPalaces(z: ZVector, g: GuansangZ, foreheadReliable = true): PalaceResult[] {
  const zs: Record<PalaceKey, number> = {
    money: avg(z.noseWidth, z.noseLength),
    work: foreheadReliable ? g.zoneUp : 0,
    love: avg(z.eyeTilt, g.eyeCornerToEdge),
    people: avg(g.browLength, z.browTilt),
    base: avg(z.jawWidth, -g.jawAngle),
  }
  const res: PalaceResult[] = PALACE_KEYS.map((key) => ({
    key,
    z: zs[key],
    label: zs[key] >= T ? 'strong' : zs[key] <= -T ? 'grow' : 'even',
  }))
  // 두드러진 자리는 최소 1곳: z가 가장 높은 곳(동점이면 앞 순서)
  if (!res.some((p) => p.label === 'strong')) {
    let best = res[0]
    for (const p of res) if (p.z > best.z) best = p
    best.label = 'strong'
  }
  // 가꿀수록 자라는 자리는 최대 2곳: z가 낮은 2곳만 남긴다
  const grows = res.filter((p) => p.label === 'grow')
  if (grows.length > 2) {
    const keep = [...grows].sort((a, b) => a.z - b.z).slice(0, 2)
    for (const p of grows) if (!keep.includes(p)) p.label = 'even'
  }
  return res
}

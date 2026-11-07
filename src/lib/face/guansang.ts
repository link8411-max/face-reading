// 관상 2판 분류기: 얼굴형 5(프로토타입 거리 + bias) × 센 자리 3(구간 z + bias) = 15유형
import type { ZVector } from './featureStats'
import type { GuansangZ } from './guansangStats'
import { ZONE_UP_RANGE } from './guansangFeatures'
import { SHAPE_KEYS, ZONE_KEYS, type GuansangTypeKey, type ShapeKey, type ZoneKey } from './guansangKeys'
import { readPalaces, type PalaceResult } from './palaces'
import calibrationJson from './guansangCalibration.json'

export interface GuansangInput { z: ZVector; g: GuansangZ; zones: { up: number; mid: number; down: number } }
export interface GuansangResult {
  type: GuansangTypeKey; shape: ShapeKey; zone: ZoneKey
  balanced: boolean; foreheadUncertain: boolean; palaces: PalaceResult[]
}
export interface Calibration { seed: number; n: number; shapeBias: Record<ShapeKey, number>; zoneBias: Record<ZoneKey, number> }

export const DEFAULT_CALIBRATION = calibrationJson as Calibration

// 얼굴형 프로토타입 z (faceAspect는 z, 나머지는 관상 전용 g)
export const SHAPE_PROFILES: Record<ShapeKey, Record<string, number>> = {
  wood: { faceAspect: 1.0, cheekWidth: -0.6, jawCheekRatio: -0.3 },
  fire: { foreheadWidth: 0.8, jawCheekRatio: -0.9, chinTaper: -0.8 },
  earth: { faceAspect: -0.8, jawCheekRatio: 0.6, jawAngle: 0.5, cheekWidth: 0.5 },
  metal: { jawAngle: -1.0, jawCheekRatio: 0.7, cheekWidth: 0.4, chinTaper: 0.3 },
  water: { faceAspect: -0.6, jawAngle: 0.8, chinTaper: 0.6, jawCheekRatio: 0.2 },
}
const SHAPE_FEATURES = ['faceAspect', 'cheekWidth', 'jawCheekRatio', 'jawAngle', 'chinTaper', 'foreheadWidth'] as const
const W_EXPLICIT = 1.5
const BALANCED_SPREAD = 0.6

function shapeDistance(v: Record<string, number>, p: Record<string, number>): number {
  let sum = 0
  for (const k of SHAPE_FEATURES) {
    const target = p[k]
    const w = target === undefined ? 1 : W_EXPLICIT
    sum += w * (v[k] - (target ?? 0)) ** 2
  }
  return Math.sqrt(sum)
}

export function classifyGuansang(input: GuansangInput, cal: Calibration = DEFAULT_CALIBRATION): GuansangResult {
  const { z, g, zones } = input
  const merged: Record<string, number> = { faceAspect: z.faceAspect, ...g }

  let shape: ShapeKey = SHAPE_KEYS[0], bestS = Infinity
  for (const s of SHAPE_KEYS) {
    const score = shapeDistance(merged, SHAPE_PROFILES[s]) + (cal.shapeBias[s] ?? 0)
    if (score < bestS) { bestS = score; shape = s }
  }

  const foreheadUncertain = zones.up < ZONE_UP_RANGE.min || zones.up > ZONE_UP_RANGE.max
  const zz: Record<ZoneKey, number> = { up: g.zoneUp, mid: g.zoneMid, down: g.zoneDown }
  let zone: ZoneKey = 'mid', bestZ = -Infinity
  for (const k of ZONE_KEYS) {
    if (foreheadUncertain && k === 'up') continue
    const score = zz[k] + (cal.zoneBias[k] ?? 0)
    if (score > bestZ) { bestZ = score; zone = k }
  }
  const vals = [g.zoneUp, g.zoneMid, g.zoneDown]
  const balanced = Math.max(...vals) - Math.min(...vals) <= BALANCED_SPREAD

  return {
    type: `${shape}-${zone}`, shape, zone, balanced, foreheadUncertain,
    palaces: readPalaces(z, g, !foreheadUncertain),
  }
}

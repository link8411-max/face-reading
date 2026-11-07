import { toZ, type Gender } from './featureStats'
import { sampleFeatures, mulberry32 } from './sampleFeatures'
import { sampleGuansang, toZGuansang } from './guansangStats'
import { classifyGuansang, type Calibration } from './guansang'

// 가상 사용자 n명을 실제 경로(toZ·toZGuansang → classifyGuansang)로 분류한 15유형별 횟수
export function simulateGuansang(n: number, gender: Gender, cal: Calibration, seed: number): Record<string, number> {
  const rng = mulberry32(seed)
  const counts: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const f = sampleFeatures(rng, gender)
    const gf = sampleGuansang(rng, gender)
    const r = classifyGuansang(
      { z: toZ(f, gender), g: toZGuansang(gf, gender), zones: { up: gf.zoneUp, mid: gf.zoneMid, down: gf.zoneDown } },
      cal,
    )
    counts[r.type] = (counts[r.type] ?? 0) + 1
  }
  return counts
}

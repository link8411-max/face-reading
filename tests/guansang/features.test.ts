import { describe, it, expect } from 'vitest'
import { extractGuansangFeatures, GUANSANG_KEYS } from '@/lib/face/guansangFeatures'
import type { Landmark } from '@/lib/face/landmarkFeatures'
import { fakeLandmarks } from './fakeLandmarks'

const base = () => fakeLandmarks()
const pt = (lm: Landmark[], i: number) => ({ x: lm[i].x, y: lm[i].y })

describe('extractGuansangFeatures', () => {
  it('세 구역 비율의 합은 1이다', () => {
    const f = extractGuansangFeatures(base())
    expect(Math.abs(f.zoneUp + f.zoneMid + f.zoneDown - 1)).toBeLessThan(1e-9)
  })

  it('확대·이동·5도 회전해도 특징이 같다', () => {
    const a = extractGuansangFeatures(base())
    const rad = (5 * Math.PI) / 180
    const c = Math.cos(rad), s = Math.sin(rad)
    const moved = base().map((p) => {
      const x = p.x * 2, y = p.y * 2
      return { x: x * c - y * s + 0.1, y: x * s + y * c + 0.2 }
    })
    const b = extractGuansangFeatures(moved)
    for (const k of GUANSANG_KEYS) expect(Math.abs(a[k] - b[k])).toBeLessThan(1e-6)
  })

  it('턱 모서리를 바깥으로 벌리면 jawCheekRatio와 jawAngle이 커진다', () => {
    const a = extractGuansangFeatures(base())
    const lm = base()
    const l = pt(lm, 172), r = pt(lm, 397)
    const b = extractGuansangFeatures(fakeLandmarks({ 172: { x: l.x - 0.04, y: l.y }, 397: { x: r.x + 0.04, y: r.y } }))
    expect(b.jawCheekRatio).toBeGreaterThan(a.jawCheekRatio)
    expect(b.jawAngle).toBeGreaterThan(a.jawAngle)
  })

  it('턱끝 양쪽(148·377)을 모으면 chinTaper가 작아진다', () => {
    const a = extractGuansangFeatures(base())
    const lm = base()
    const l = pt(lm, 148), r = pt(lm, 377)
    const b = extractGuansangFeatures(fakeLandmarks({ 148: { x: l.x + 0.03, y: l.y }, 377: { x: r.x - 0.03, y: r.y } }))
    expect(b.chinTaper).toBeLessThan(a.chinTaper)
  })

  it('한쪽 광대(116)만 어긋나도 cheekWidth는 좌우 평균이라 변화가 반으로 줄어든다', () => {
    const a = extractGuansangFeatures(base())
    const lm = base()
    const l = pt(lm, 116)
    // 중심선(0.5)에서 광대까지 거리(반폭)의 3%만큼 바깥으로
    const out = (0.5 - l.x) * 0.03
    const b = extractGuansangFeatures(fakeLandmarks({ 116: { x: l.x - out, y: l.y } }))
    expect(Math.abs(b.cheekWidth / a.cheekWidth - 1)).toBeLessThanOrEqual(0.015 + 1e-9)
  })

  it('좌우 ±5% 비대칭에도 얼굴형 특징이 크게 뒤집히지 않는다', () => {
    const a = extractGuansangFeatures(base())
    const lm = base()
    const p116 = pt(lm, 116), p345 = pt(lm, 345), p172 = pt(lm, 172), p397 = pt(lm, 397)
    const b = extractGuansangFeatures(fakeLandmarks({
      116: { x: p116.x - (0.5 - p116.x) * 0.05, y: p116.y }, 345: { x: p345.x - (p345.x - 0.5) * 0.05, y: p345.y },
      172: { x: p172.x - (0.5 - p172.x) * 0.05, y: p172.y }, 397: { x: p397.x - (p397.x - 0.5) * 0.05, y: p397.y },
    }))
    expect(Math.abs(b.jawCheekRatio / a.jawCheekRatio - 1)).toBeLessThan(0.05)
    expect(Math.abs(b.cheekWidth / a.cheekWidth - 1)).toBeLessThan(0.06)
  })
})

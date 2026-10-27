import { FEATURE_KEYS, type FeatureKey, type FeatureVector } from '@/lib/face/landmarkFeatures'
import { toZ, type ZVector } from '@/lib/face/featureStats'
import { samgukCharacters } from '@/lib/samgukDB'
import portraitFeatures from './portraitFeatures.json'
import type { CharacterProfile } from './profiles'

// 초상화에서 잰 얼굴 특징으로 장수 프로필을 만든다 (scripts/measure-portraits.mjs).
// 초상화는 화풍 때문에 모두 눈꼬리가 올라가고 입이 작게 그려져 있어 그대로 쓰면 실제 얼굴과 비교가 안 된다.
// 그래서 성별마다 초상화 평균·표준편차로 다시 표준화해 "다른 초상화보다 얼굴이 넓다" 같은 그 그림만의 특징을 쓴다.

const MAX_KEYS = 6
const MIN_KEYS = 4
const MIN_REL = 0.5
const Z_LIMIT = 2.5

const measured = portraitFeatures as Record<string, FeatureVector | null>

export function portraitRelativeZ(): Record<string, ZVector | undefined> {
  const out: Record<string, ZVector | undefined> = {}
  for (const g of ['남', '여'] as const) {
    const zs = samgukCharacters
      .filter((c) => c.gender === g && measured[c.id])
      .map((c) => ({ id: c.id, z: toZ(measured[c.id]!, g) }))
    const stat = Object.fromEntries(
      FEATURE_KEYS.map((k) => {
        const v = zs.map((x) => x.z[k])
        const mean = v.reduce((s, x) => s + x, 0) / v.length
        const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length - 1)) || 1
        return [k, { mean, sd }]
      }),
    ) as Record<FeatureKey, { mean: number; sd: number }>
    for (const { id, z } of zs)
      out[id] = Object.fromEntries(FEATURE_KEYS.map((k) => [k, (z[k] - stat[k].mean) / stat[k].sd])) as ZVector
  }
  return out
}

// 가장 두드러진 특징 4~6개를 고르고, 두드러질수록 무게를 준다
export function profileFromRelative(rel: ZVector): CharacterProfile {
  const keys = [...FEATURE_KEYS].sort((a, b) => Math.abs(rel[b]) - Math.abs(rel[a]))
  const picked = keys.filter((k, i) => i < MIN_KEYS || (i < MAX_KEYS && Math.abs(rel[k]) >= MIN_REL))
  const round = (v: number) => Math.round(v * 100) / 100
  const z: CharacterProfile['z'] = {}
  const weight: CharacterProfile['weight'] = {}
  for (const k of picked) {
    z[k] = round(Math.max(-Z_LIMIT, Math.min(Z_LIMIT, rel[k])))
    weight[k] = round(Math.max(0.5, Math.min(2, 0.5 + 0.6 * Math.abs(rel[k]))))
  }
  return { z, weight }
}

import { characterProfiles } from '@/lib/samguk/profiles'
import { samgukCharacters } from '@/lib/samgukDB'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'

const vec = (id: string) => FEATURE_KEYS.map((k) => characterProfiles[id].z[k] ?? 0)

test('모든 samgukCharacters id에 프로필이 있다', () => {
  for (const c of samgukCharacters) expect(characterProfiles[c.id], c.id).toBeDefined()
})

test('각 프로필은 특징 4~7개, z는 [-2.5, 2.5], weight는 [0.5, 2]', () => {
  for (const [id, p] of Object.entries(characterProfiles)) {
    const keys = Object.keys(p.z)
    expect(keys.length, id).toBeGreaterThanOrEqual(4)
    expect(keys.length, id).toBeLessThanOrEqual(7)
    for (const v of Object.values(p.z)) expect(Math.abs(v!), id).toBeLessThanOrEqual(2.5)
    for (const w of Object.values(p.weight)) {
      expect(w!, id).toBeGreaterThanOrEqual(0.5)
      expect(w!, id).toBeLessThanOrEqual(2)
    }
  }
})

test('성별마다 프로필이 서로 너무 같지 않다 (거리 0.8 이상)', () => {
  for (const g of ['남', '여'] as const) {
    const ids = samgukCharacters.filter((c) => c.gender === g).map((c) => c.id)
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = vec(ids[i]), b = vec(ids[j])
        const d = Math.hypot(...a.map((v, k) => v - b[k]))
        expect(d, `${ids[i]} vs ${ids[j]}`).toBeGreaterThanOrEqual(0.8)
      }
  }
})

test('FEATURE_KEYS마다 양수·음수 값을 쓰는 인물이 각각 1명 이상', () => {
  for (const k of FEATURE_KEYS) {
    const vals = Object.values(characterProfiles).map((p) => p.z[k]).filter((v) => v !== undefined) as number[]
    expect(vals.some((v) => v > 0), `${k} +`).toBe(true)
    expect(vals.some((v) => v < 0), `${k} -`).toBe(true)
  }
})

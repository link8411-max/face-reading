import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'
import { portraitRelativeZ, profileFromRelative } from '@/lib/samguk/portraitProfiles'
import portraitFeatures from '@/lib/samguk/portraitFeatures.json'
import { characterProfiles, handProfiles } from '@/lib/samguk/profiles'
import { matchCharacter } from '@/lib/samguk/matcher'
import calibration from '@/lib/samguk/calibration.json'
import { samgukCharacters } from '@/lib/samgukDB'

const rel = portraitRelativeZ()

test('초상화 상대 z는 성별마다 평균 0이다 (화풍 쏠림 제거)', () => {
  for (const g of ['남', '여'] as const) {
    const ids = samgukCharacters.filter((c) => c.gender === g && rel[c.id]).map((c) => c.id)
    for (const k of FEATURE_KEYS) {
      const mean = ids.reduce((s, id) => s + rel[id]![k], 0) / ids.length
      expect(Math.abs(mean), `${g} ${k}`).toBeLessThan(1e-9)
    }
  }
})

test('프로필은 그림에서 가장 두드러진 특징을 같은 방향으로 쓴다', () => {
  const r = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as ZVector
  r.faceAspect = -2.1; r.lipFullness = 1.4; r.eyeTilt = 0.9; r.noseWidth = 0.7; r.mouthWidth = -0.6; r.browGap = 0.2
  const p = profileFromRelative(r)
  expect(p.z.faceAspect).toBeCloseTo(-2.1)
  expect(p.z.lipFullness).toBeCloseTo(1.4)
  expect(p.z.browGap).toBeUndefined()
  expect(p.weight.faceAspect!).toBeGreaterThan(p.weight.noseWidth!)
})

test('z는 ±2.5로 자른다', () => {
  const r = Object.fromEntries(FEATURE_KEYS.map((k, i) => [k, i === 0 ? 3.4 : (i % 2 ? 0.8 : -0.7)])) as ZVector
  expect(profileFromRelative(r).z[FEATURE_KEYS[0]]).toBe(2.5)
})

test('얼굴을 인식한 초상화는 그림 기준 프로필, 못 한 초상화는 글 묘사 프로필을 쓴다', () => {
  for (const c of samgukCharacters) {
    const measured = (portraitFeatures as Record<string, unknown>)[c.id]
    if (measured) expect(characterProfiles[c.id], c.id).toEqual(profileFromRelative(rel[c.id]!))
    else expect(characterProfiles[c.id], c.id).toEqual(handProfiles[c.id])
  }
})

test('모든 장수의 초상화를 측정했다', () => {
  for (const c of samgukCharacters) expect(c.id in portraitFeatures, c.id).toBe(true)
})

test('초상화 얼굴(화풍 쏠림 제거)을 넣으면 대부분 그 장수가 나온다', () => {
  const ids = samgukCharacters.filter((c) => rel[c.id])
  const hit = ids.filter((c) => matchCharacter(rel[c.id]!, c.gender, calibration.bias).character.id === c.id)
  expect(hit.length / ids.length).toBeGreaterThanOrEqual(0.9)
})

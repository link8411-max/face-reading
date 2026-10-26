import { matchCharacter, distance } from '@/lib/samguk/matcher'
import { characterProfiles } from '@/lib/samguk/profiles'
import { samgukCharacters } from '@/lib/samgukDB'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'

const zeros = () => Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as ZVector
const zOf = (id: string) => ({ ...zeros(), ...characterProfiles[id].z }) as ZVector

test('인물 프로필과 같은 z를 넣으면 그 인물이 나온다', () => {
  for (const c of samgukCharacters) {
    expect(distance(zOf(c.id), characterProfiles[c.id])).toBe(0)
    expect(matchCharacter(zOf(c.id), c.gender).character.id, c.id).toBe(c.id)
  }
})

test('같은 입력이면 같은 결과(결정성)', () => {
  const z = { ...zeros(), eyeTilt: 1.3, faceAspect: -0.7, mouthWidth: 0.4 }
  expect(matchCharacter(z, '남')).toEqual(matchCharacter(z, '남'))
})

test('성별 필터: 여 선택 시 여성 인물만', () => {
  for (const id of ['guanyu', 'zhangfei', 'lvbu']) expect(matchCharacter(zOf(id), '여').character.gender).toBe('여')
})

test('similarity는 정수이고 70~98', () => {
  const cases: ZVector[] = [zeros(), zOf('guanyu'),
    Object.fromEntries(FEATURE_KEYS.map((k) => [k, 3])) as ZVector,
    Object.fromEntries(FEATURE_KEYS.map((k, i) => [k, i % 2 ? 3 : -3])) as ZVector]
  for (const z of cases) for (const g of ['남', '여'] as const) {
    const s = matchCharacter(z, g).similarity
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(70)
    expect(s).toBeLessThanOrEqual(98)
  }
})

test('matchReason에 인물 이름이 들어가고 비어 있지 않다', () => {
  const r = matchCharacter(zOf('guanyu'), '남')
  expect(r.matchReason).toContain('관우')
  expect(r.name).toBe('관우')
})

test('faceAnalysis 다섯 항목 모두 비어 있지 않다', () => {
  const r = matchCharacter({ ...zeros(), eyeAspect: 1.5 }, '여')
  for (const k of ['눈', '코', '입', '얼굴형', '인상'] as const) expect(r.faceAnalysis[k].length, k).toBeGreaterThan(0)
})

test('bias가 크면 해당 인물이 덜 뽑힌다', () => {
  expect(matchCharacter(zOf('guanyu'), '남', { guanyu: 10 }).character.id).not.toBe('guanyu')
})

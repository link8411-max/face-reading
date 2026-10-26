import { readFileSync } from 'node:fs'
import { matchAnimal, describe as describeFace, ANIMAL_KEYS } from '@/lib/animal/matcher'
import { animalProfiles } from '@/lib/animal/profiles'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'

const zero = () => Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as ZVector
const profileZ = (key: string) => ({ ...zero(), ...animalProfiles[key].z }) as ZVector

test('동물상 8종 모두 프로필이 있고 animalTypeDB 키와 같다', () => {
  expect([...ANIMAL_KEYS].sort()).toEqual(['bear', 'cat', 'deer', 'dog', 'eagle', 'fox', 'rabbit', 'tiger'])
  for (const k of ANIMAL_KEYS) expect(animalProfiles[k], k).toBeDefined()
})

test.each([...ANIMAL_KEYS])('%s 프로필 그대로의 얼굴은 그 동물상이 나온다', (key) => {
  expect(matchAnimal(profileZ(key)).type).toBe(key)
})

test('결정적이고 매칭률은 70~98 정수, 두 번째 동물상은 1순위와 다르다', () => {
  const z = { ...zero(), eyeAspect: 0.7, eyeTilt: -0.4 }
  const a = matchAnimal(z), b = matchAnimal(z)
  expect(a).toEqual(b)
  expect(Number.isInteger(a.matchScore)).toBe(true)
  expect(a.matchScore).toBeGreaterThanOrEqual(70)
  expect(a.matchScore).toBeLessThanOrEqual(98)
  expect(a.secondaryType).not.toBe(a.type)
})

// 리뷰 포커스 1: '큰 가늘고 긴 눈' 같은 모순 묘사 금지
test('눈 묘사는 반대되는 표현을 함께 쓰지 않는다 (81조합 전수)', () => {
  const steps = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]
  for (const a of steps) for (const t of steps) {
    const d = describeFace({ ...zero(), eyeAspect: a, eyeTilt: t })
    const round = /동그란|큰/.test(d.눈), thin = /가는|가늘/.test(d.눈)
    expect(round && thin, `${a},${t}: ${d.눈}`).toBe(false)
    const up = /올라간/.test(d.눈), down = /내려간|처진/.test(d.눈)
    expect(up && down, `${a},${t}: ${d.눈}`).toBe(false)
  }
})

test('특징 묘사에 외모를 깎아내리는 말이 없다', () => {
  const steps = [-2, 0, 2]
  for (const v of steps) {
    const d = describeFace(Object.fromEntries(FEATURE_KEYS.map((k) => [k, v])) as ZVector)
    expect(Object.values(d).join(' ')).not.toMatch(/못생|작은 눈|처진|나쁜|이상한/)
  }
})

test('동물상 페이지는 face-api를 쓰지 않고 MediaPipe·성별 기준을 쓴다', () => {
  const src = readFileSync('src/app/animal/page.tsx', 'utf8')
  expect(src).not.toContain('faceDetection')
  expect(src).toContain('detectLandmarks')
  expect(src).toContain('checkFrontal')
  expect(src).toContain('toZ(features, gender)')
})

// 리뷰 Important: 특징 문장이 같은 화면의 동물상 설명(대표 인상)과 반대로 나오지 않는다
import { toZ } from '@/lib/face/featureStats'
import { sampleFeatures, mulberry32 } from '@/lib/face/sampleFeatures'

const OPPOSITE: Record<string, (d: ReturnType<typeof describeFace>) => boolean> = {
  dog: (d) => /가늘고|올라간/.test(d.눈) || /갸름하고/.test(d.얼굴형),
  cat: (d) => /내려간/.test(d.눈) || /다부진/.test(d.턱),
  fox: (d) => /동그란|내려간/.test(d.눈) || /동그란/.test(d.얼굴형) || /다부진/.test(d.턱),
  bear: (d) => /갸름하고/.test(d.얼굴형) || /갸름한/.test(d.턱) || /오똑/.test(d.코),
  rabbit: (d) => /가늘고/.test(d.눈),
  deer: (d) => /가늘고/.test(d.눈) || /동그란 편/.test(d.얼굴형),
  tiger: (d) => /동그란 눈/.test(d.눈) || /갸름한/.test(d.턱),
  eagle: (d) => /복스러운/.test(d.코),
}

test.each(['여', '남'] as const)('%s: 매칭된 동물상의 대표 인상과 반대되는 특징 문장이 없다', (g) => {
  const rng = mulberry32(9)
  for (let i = 0; i < 3000; i++) {
    const r = matchAnimal(toZ(sampleFeatures(rng, g), g))
    expect(OPPOSITE[r.type](r.features), `${r.type}: ${JSON.stringify(r.features)}`).toBe(false)
  }
})

import { animalTypeDB } from '@/lib/animalTypeDB'
import { matchAnimal, ANIMAL_KEYS } from '@/lib/animal/matcher'
import { animalProfiles } from '@/lib/animal/profiles'
import { FEATURE_KEYS } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'
import NextTests from '@/components/result/NextTests'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// 20대에만 어울리거나 외모를 성적으로 묘사하는 표현: 나이·성별과 상관없이 누구에게 나와도 어색하지 않아야 한다
const NARROW = ['애교', '청순', '보호본능', '지켜주고 싶', '요염', '섹시', '순종', '청초', '귀여움', '귀엽']

test('동물상 결과 문구는 나이·성별과 상관없이 어울린다', () => {
  for (const [k, a] of Object.entries(animalTypeDB)) {
    const text = [a.title, a.description, a.charm, a.loveStyle, ...a.personality.positive].join(' ')
    for (const w of NARROW) expect(text, `${k}: ${w}`).not.toContain(w)
  }
})

const zeros = () => Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as ZVector

test('1·2등이 거의 같으면 두 번째 동물상도 함께 알려 준다', () => {
  // 평균에 가까운 얼굴 (시연 사진 person1, 여자 기준 z)
  const z = { ...zeros(), eyeAspect: 0.47, eyeSpacing: 0.58, noseLength: 0.43, mouthWidth: -0.7, lipFullness: 1.02, mouthCornerLift: -0.63, browGap: -0.38, eyeWidth: -0.37, browTilt: -0.33 }
  const r = matchAnimal(z)
  expect(r.blend).toBeDefined()
  expect(r.blend).not.toBe(r.type)
})

test('한 동물상에 뚜렷하게 가까우면 하나만 말한다', () => {
  for (const k of ANIMAL_KEYS) {
    const z = { ...zeros(), ...Object.fromEntries(Object.entries(animalProfiles[k].z).map(([f, v]) => [f, v! * 1.6])) } as ZVector
    const r = matchAnimal(z)
    expect(r.type, k).toBe(k)
    expect(r.blend, k).toBeUndefined()
  }
})

test('다음 테스트 카드는 관상을 먼저 추천한다', () => {
  for (const current of ['samguk', 'animal'] as const) {
    const html = renderToStaticMarkup(<NextTests current={current} image="data:x" />)
    expect(html.indexOf('href="/face2"'), current).toBeLessThan(html.indexOf(current === 'samguk' ? 'href="/animal"' : 'href="/samguk"'))
  }
})

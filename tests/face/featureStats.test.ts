import { FEATURE_STATS_BY_GENDER, toZ, type Gender } from '@/lib/face/featureStats'
import { extractFeatures, FEATURE_KEYS, type FeatureVector } from '@/lib/face/landmarkFeatures'
import { makeFace } from './makeFace'

const meanFace = (g: Gender) => Object.fromEntries(FEATURE_KEYS.map((k) => [k, FEATURE_STATS_BY_GENDER[g][k].mean])) as FeatureVector

test.each(['남', '여'] as const)('%s 평균 얼굴은 자기 성별 기준에서 z가 모두 0', (g) => {
  const z = toZ(meanFace(g), g)
  for (const k of FEATURE_KEYS) expect(Math.abs(z[k]), k).toBeLessThan(0.01)
})

// 리뷰 포커스: 여성 얼굴을 남성 기준으로 재면 문헌과 같은 방향으로 치우친다(턱 끝 짧고 중안면 비율 큼)
test('여성 평균 얼굴을 남성 기준으로 재면 chinLength는 음수, midfaceRatio는 양수', () => {
  const z = toZ(meanFace('여'), '남')
  expect(z.chinLength).toBeLessThan(0)
  expect(z.midfaceRatio).toBeGreaterThan(0)
  expect(z.eyeAspect).toBeGreaterThan(0)
})

test('std는 모두 양수이고 두 성별이 같은 값(성별 내 합동 편차)', () => {
  for (const k of FEATURE_KEYS) {
    expect(FEATURE_STATS_BY_GENDER.여[k].std, k).toBeGreaterThan(0)
    expect(FEATURE_STATS_BY_GENDER.여[k].std, k).toBe(FEATURE_STATS_BY_GENDER.남[k].std)
  }
})

test('극단값은 ±3으로 잘린다', () => {
  const f = extractFeatures(makeFace())
  const z = toZ({ ...f, faceAspect: 99, eyeTilt: -99 }, '여')
  expect(z.faceAspect).toBe(3)
  expect(z.eyeTilt).toBe(-3)
})

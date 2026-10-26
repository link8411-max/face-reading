import rows from './fixtures/mediapipe-features.json'
import { readFileSync } from 'node:fs'
import { FEATURE_STATS_BY_GENDER, toZ, type Gender } from '@/lib/face/featureStats'
import { FEATURE_KEYS, type FeatureVector } from '@/lib/face/landmarkFeatures'
import { sampleFeatures, mulberry32 } from '@/lib/face/sampleFeatures'
import { matchCharacter } from '@/lib/samguk/matcher'
import calibration from '@/lib/samguk/calibration.json'
import { samgukCharacters } from '@/lib/samgukDB'

// 실측 고정 데이터: 정면 성인 dev 얼굴 20장(여 8, 남 12)의 MediaPipe 특징값
const data = rows as { gender: Gender; features: FeatureVector }[]
const of = (g: Gender) => data.filter((r) => r.gender === g).map((r) => r.features)
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length

// 리뷰 Important: 축소 추정은 두 성별 평균의 한가운데를 향해야 한다 (표본 수로 가중하면 많은 쪽 성별로 기운다)
test('성별 기준 평균의 가운데는 두 성별 표본 평균의 가운데와 같다', () => {
  for (const k of FEATURE_KEYS) {
    const mid = (mean(of('여').map((f) => f[k])) + mean(of('남').map((f) => f[k]))) / 2
    const statsMid = (FEATURE_STATS_BY_GENDER.여[k].mean + FEATURE_STATS_BY_GENDER.남[k].mean) / 2
    expect(Math.abs(statsMid - mid), k).toBeLessThan(FEATURE_STATS_BY_GENDER.여[k].std * 0.02)
  }
})

// 리뷰 Critical (a): 실제 얼굴을 자기 성별 기준으로 재면 특징마다 평균 z가 0 근처
test.each(['여', '남'] as const)('%s 실측 얼굴은 자기 성별 기준에서 특징별 평균 z가 0.5 미만', (g) => {
  const zs = of(g).map((f) => toZ(f, g))
  for (const k of FEATURE_KEYS) expect(Math.abs(mean(zs.map((z) => z[k]))), k).toBeLessThan(0.5)
})

test('여성 실측 얼굴을 남성 기준으로 재면 턱·중안부·얼굴형에서 더 치우친다', () => {
  for (const k of ['chinLength', 'midfaceRatio', 'faceAspect'] as const) {
    const right = Math.abs(mean(of('여').map((f) => toZ(f, '여')[k])))
    const wrong = Math.abs(mean(of('여').map((f) => toZ(f, '남')[k])))
    expect(wrong, k).toBeGreaterThan(right)
  }
})

// 리뷰 Critical (b): 기준이 섞이면 시뮬레이션에서 쏠림이 커진다 (이 테스트가 기준 혼동을 잡아낸다)
test('여성 가상 얼굴을 남성 기준으로 재면 장수 쏠림이 맞는 기준일 때보다 커진다', () => {
  const ids = samgukCharacters.filter((c) => c.gender === '여').map((c) => c.id)
  const maxRatio = (scoreAs: Gender) => {
    const rng = mulberry32(42), counts: Record<string, number> = {}, n = 6000
    for (let i = 0; i < n; i++) {
      const id = matchCharacter(toZ(sampleFeatures(rng, '여'), scoreAs), '여', calibration.bias).character.id
      counts[id] = (counts[id] ?? 0) + 1
    }
    return Math.max(...ids.map((id) => (counts[id] ?? 0) / (n / ids.length)))
  }
  expect(maxRatio('남')).toBeGreaterThan(maxRatio('여'))
})

// 리뷰 Critical (c): 화면 코드가 사용자가 고른 성별 기준을 쓴다
test.each([
  ['src/app/samguk/page.tsx', 'toZ(features, gender)'],
  ['src/app/animal/page.tsx', 'toZ(features, gender)'],
  ['src/app/dev/face-lab/FaceLab.tsx', 'toZ(features, job.gender)'],
])('%s는 성별 기준으로 z를 낸다', (file, call) => {
  expect(readFileSync(file, 'utf8')).toContain(call)
})

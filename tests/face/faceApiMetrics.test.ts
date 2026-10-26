import rows from './fixtures/faceapi-metrics.json'
import thresholds from '@/lib/face/faceApiThresholds.json'
import { classifyFace, type FaceMetrics, type Thresholds } from '@/lib/face/faceApiMetrics'

// 관상(face-api) 구간 경계가 실제 얼굴 분포에 맞는지: 정면 성인 dev 얼굴 20장 실측값으로 검사
// (이전 버그: 턱 각도가 라디안인데 경계가 2.0/2.5라 전원 '각진 턱', 눈 비율 0.35 경계로 전원 '가는 눈')
const feats = (rows as { metrics: FaceMetrics }[]).map((r) => classifyFace(r.metrics, thresholds as Thresholds))
const share = (vals: string[]) => Math.max(...Object.values(vals.reduce<Record<string, number>>((c, v) => ((c[v] = (c[v] ?? 0) + 1), c), {}))) / vals.length

// nostrilR·chinLengthR는 측정식이 자기 자신을 나눠 늘 1이라(원래 코드의 결함) 판정에서 빼고 '보통' 고정
const CASES: [string, (f: (typeof feats)[number]) => string][] = [
  ['턱 모양', (f) => f.chin.shape], ['눈 모양', (f) => f.eyes.shape], ['눈 크기', (f) => f.eyes.size], ['눈꼬리', (f) => f.eyes.corners],
  ['눈 간격', (f) => f.eyes.spacing], ['눈썹 모양', (f) => f.eyebrows.shape], ['코 크기', (f) => f.nose.size], ['코끝', (f) => f.nose.tip],
  ['입 크기', (f) => f.mouth.size], ['입술', (f) => f.mouth.shape], ['입꼬리', (f) => f.mouth.corners], ['턱 너비', (f) => f.chin.width],
  ['얼굴형', (f) => f.faceShape.type], ['이마 높이', (f) => f.forehead.height],
]

test.each(CASES)('%s: 한 구간에 70% 넘게 몰리지 않는다', (_, pick) => {
  expect(share(feats.map(pick))).toBeLessThanOrEqual(0.7)
})

test('턱 모양 3가지(각진·둥근·뾰족)가 모두 나온다', () => {
  expect(new Set(feats.map((f) => f.chin.shape)).size).toBe(3)
})

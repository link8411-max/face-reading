import { analyzeLandmarks, REASON_TEXT } from '@/lib/face/analyzePhoto'
import { makeFace } from './makeFace'

test('얼굴이 없으면 noface, 정면이 아니면 frontal, 정상이면 성별 기준 z', () => {
  expect(analyzeLandmarks(null, '여')).toEqual({ ok: false, reason: 'noface' })
  const face = makeFace()
  const ok = analyzeLandmarks(face, '여')
  expect(ok.ok).toBe(true)
  if (ok.ok) expect(Object.keys(ok.z)).toContain('eyeAspect')
  // 코끝을 옆으로 크게 옮겨 고개를 돌린 얼굴로 만든다
  const turned = face.map((p, i) => (i === 1 ? { ...p, x: p.x + 200 } : p))
  expect(analyzeLandmarks(turned, '여')).toEqual({ ok: false, reason: 'frontal' })
})

test('실패 이유마다 한국어 안내가 있다', () => {
  for (const r of ['tool', 'noface', 'frontal', 'read'] as const) expect(REASON_TEXT[r]).toMatch(/[가-힣]/)
  expect(REASON_TEXT.tool).toContain('분석 도구를 불러오지 못했어요')
  expect(REASON_TEXT.noface).toContain('얼굴을 찾지 못했어요')
})

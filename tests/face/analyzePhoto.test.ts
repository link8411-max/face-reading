import { analyzeLandmarks, failText, REASON_TEXT } from '@/lib/face/analyzePhoto'
import { makeFace } from './makeFace'

test('얼굴이 없으면 noface, 정면이 아니면 frontal(방향·정도 포함), 정상이면 성별 기준 z', () => {
  expect(analyzeLandmarks(null, '여')).toEqual({ ok: false, reason: 'noface' })
  const face = makeFace()
  const ok = analyzeLandmarks(face, '여')
  expect(ok.ok).toBe(true)
  if (ok.ok) expect(Object.keys(ok.z)).toContain('eyeAspect')
  // 코끝을 옆으로 크게 옮겨 고개를 돌린 얼굴로 만든다
  const turned = analyzeLandmarks(face.map((p, i) => (i === 1 ? { ...p, x: p.x + 200 } : p)), '여')
  expect(turned.ok).toBe(false)
  if (!turned.ok) {
    expect(turned.reason).toBe('frontal')
    expect(turned.yaw).toBeGreaterThan(0.15)
    expect(turned.turnedTo).toBe('오른쪽')
  }
  const turnedL = analyzeLandmarks(face.map((p, i) => (i === 1 ? { ...p, x: p.x - 200 } : p)), '여')
  if (!turnedL.ok) expect(turnedL.turnedTo).toBe('왼쪽')
})

test('실패 이유마다 한국어 안내가 있다', () => {
  for (const r of ['tool', 'noface', 'frontal', 'read'] as const) expect(REASON_TEXT[r]).toMatch(/[가-힣]/)
  expect(REASON_TEXT.tool).toContain('분석 도구를 불러오지 못했어요')
  expect(REASON_TEXT.noface).toContain('얼굴을 찾지 못했어요')
})

test('고개 돌림 실패는 방향과 돌아간 정도를 숫자로 알려 준다', () => {
  expect(failText({ ok: false, reason: 'frontal', yaw: 0.24, turnedTo: '오른쪽' })).toBe(
    '고개가 오른쪽으로 돌아가 있어요(돌아간 정도 24, 15 이하여야 해요). 카메라를 똑바로 보고 찍은 사진으로 다시 해 주세요.',
  )
  // 정도를 모르면(옛 호출) 일반 안내로
  expect(failText({ ok: false, reason: 'frontal' })).toBe(REASON_TEXT.frontal)
  expect(failText({ ok: false, reason: 'noface' })).toBe(REASON_TEXT.noface)
})

// 결과 공개 모션의 단계 계획. 순수 함수라 테스트하기 쉽다.
export const REVEAL_STEPS = ['dots', 'zones', 'palaces', 'card'] as const
export type RevealStep = (typeof REVEAL_STEPS)[number]

export const STEP_MS: Record<RevealStep, number> = {
  dots: 800,
  zones: 1200,
  palaces: 2000, // 5곳 x 400ms
  card: 600,
}

export function revealPlan(opts: { reducedMotion: boolean; hasLandmarks: boolean }): RevealStep[] {
  if (opts.reducedMotion || !opts.hasLandmarks) return ['card']
  return [...REVEAL_STEPS]
}

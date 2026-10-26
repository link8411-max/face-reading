import { toZ } from '@/lib/face/featureStats'
import { sampleFeatures, mulberry32 } from '@/lib/face/sampleFeatures'
import { matchCharacter, type Gender } from './matcher'

export { mulberry32 }

// 가상 사용자 n명을 성별 분포에서 뽑아 실제 경로(toZ(f, gender) → matchCharacter)로 매칭한 인물별 횟수
export function simulate(n: number, gender: Gender, bias: Record<string, number>, seed: number): Record<string, number> {
  const rng = mulberry32(seed)
  const counts: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const id = matchCharacter(toZ(sampleFeatures(rng, gender), gender), gender, bias).character.id
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

import { toZ, type Gender } from '@/lib/face/featureStats'
import { sampleFeatures, mulberry32 } from '@/lib/face/sampleFeatures'
import { matchAnimal } from './matcher'

// 가상 사용자 n명을 성별 분포에서 뽑아 실제 경로(toZ(f, gender) → matchAnimal)로 매칭한 동물상별 횟수
export function simulateAnimal(n: number, gender: Gender, bias: Record<string, number>, seed: number): Record<string, number> {
  const rng = mulberry32(seed)
  const counts: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const k = matchAnimal(toZ(sampleFeatures(rng, gender), gender), bias).type
    counts[k] = (counts[k] ?? 0) + 1
  }
  return counts
}

import { FEATURE_KEYS, type FeatureKey } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'
import { samgukCharacters, type SamgukCharacter } from '@/lib/samgukDB'
import { characterProfiles, type CharacterProfile } from './profiles'

export type Gender = '남' | '여'

export interface MatchResult {
  name: string
  matchReason: string
  similarity: number                    // 정수 70~98
  faceAnalysis: { 눈: string; 코: string; 입: string; 얼굴형: string; 인상: string }
  character: SamgukCharacter
}

// 프로필에 없는 특징은 평균(0)으로 보고 약하게(0.5) 비교한다
const MISSING_WEIGHT = 0.5

export function distance(z: ZVector, p: CharacterProfile): number {
  let sum = 0
  for (const k of FEATURE_KEYS) {
    const target = p.z[k]
    const w = p.weight[k] ?? (target === undefined ? MISSING_WEIGHT : 1)
    sum += w * (z[k] - (target ?? 0)) ** 2
  }
  return Math.sqrt(sum)
}

// 특징별 표현 [+ 방향, - 방향]
const PHRASES: Record<FeatureKey, [string, string]> = {
  eyeAspect: ['눈이 둥글고 큰', '눈매가 가늘고 긴'],
  eyeTilt: ['눈꼬리가 위로 올라간', '눈꼬리가 순하게 내려간'],
  eyeWidth: ['눈이 길게 뻗은', '눈이 짧고 또렷한'],
  eyeSpacing: ['미간이 넓은', '미간이 좁은'],
  browGap: ['눈썹과 눈 사이가 여유로운', '눈썹이 눈에 바짝 붙은'],
  browTilt: ['눈썹이 힘 있게 치켜올라간', '눈썹이 부드럽게 내려간'],
  noseLength: ['콧대가 긴', '코가 짧고 귀여운'],
  noseWidth: ['콧볼이 넉넉한', '코가 좁고 오똑한'],
  mouthWidth: ['입이 시원하게 큰', '입이 작고 단정한'],
  lipFullness: ['입술이 도톰한', '입술이 얇은'],
  mouthCornerLift: ['입꼬리가 올라간', '입꼬리가 내려간'],
  faceAspect: ['얼굴이 긴', '얼굴이 넓적한'],
  jawWidth: ['턱이 각지고 넓은', '턱선이 갸름한'],
  chinLength: ['턱이 긴', '턱이 짧은'],
  midfaceRatio: ['얼굴 가운데가 긴', '얼굴 가운데가 짧은'],
}

const phrase = (k: FeatureKey, v: number) => PHRASES[k][v >= 0 ? 0 : 1]

const GROUPS: Record<'눈' | '코' | '입' | '얼굴형', { keys: FeatureKey[]; balanced: string }> = {
  눈: { keys: ['eyeAspect', 'eyeTilt', 'eyeWidth', 'eyeSpacing', 'browTilt', 'browGap'], balanced: '크기와 모양이 균형 잡힌 눈이에요' },
  코: { keys: ['noseLength', 'noseWidth'], balanced: '길이와 폭이 균형 잡힌 코예요' },
  입: { keys: ['mouthWidth', 'lipFullness', 'mouthCornerLift'], balanced: '크기와 모양이 균형 잡힌 입이에요' },
  얼굴형: { keys: ['faceAspect', 'jawWidth', 'chinLength', 'midfaceRatio'], balanced: '가로세로 비율이 균형 잡힌 얼굴형이에요' },
}

const NOTABLE = 0.5

function strongest(z: ZVector, keys: readonly FeatureKey[]): FeatureKey {
  return keys.reduce((best, k) => (Math.abs(z[k]) > Math.abs(z[best]) ? k : best), keys[0])
}

// 받침 유무로 조사 고르기 (과/와, 을/를)
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasBatchim ? withBatchim : without)
}

function buildReason(z: ZVector, p: CharacterProfile, c: SamgukCharacter): string {
  const ranked = (Object.keys(p.z) as FeatureKey[]).sort(
    (a, b) => (p.weight[b] ?? 1) - (p.weight[a] ?? 1) || Math.abs(p.z[b]!) - Math.abs(p.z[a]!),
  )
  const shared = ranked.filter((k) => Math.sign(z[k]) === Math.sign(p.z[k]!) && Math.abs(z[k]) >= 0.3).slice(0, 2)
  const firstLook = c.appearance.split(',')[0].trim()
  // 공유하는 대표 특징이 없으면 특정 특징을 단정하지 않는다 (얼굴 분석 문장과 모순 방지)
  if (shared.length === 0) {
    return `전체적인 얼굴 비율이 ${josa(c.name, '과', '와')} 가장 가까워요. ${josa(firstLook, '을', '를')} 떠올리게 해요.`
  }
  const traits = shared.map((k) => phrase(k, p.z[k]!)).join('·')
  return `${traits} 인상이 ${josa(c.name, '과', '와')} 닮았어요. ${josa(firstLook, '을', '를')} 떠올리게 해요.`
}

function buildAnalysis(z: ZVector): MatchResult['faceAnalysis'] {
  const out = {} as MatchResult['faceAnalysis']
  for (const [group, { keys, balanced }] of Object.entries(GROUPS) as [keyof typeof GROUPS, (typeof GROUPS)[keyof typeof GROUPS]][]) {
    const k = strongest(z, keys)
    out[group] = Math.abs(z[k]) < NOTABLE ? balanced : `${phrase(k, z[k])} 편이에요`
  }
  const top = strongest(z, FEATURE_KEYS)
  out.인상 = Math.abs(z[top]) < NOTABLE
    ? '어느 한 곳이 튀지 않는 조화로운 인상이에요'
    : `${phrase(top, z[top])} 점이 가장 눈에 띄는 인상이에요`
  return out
}

export function matchCharacter(z: ZVector, gender: Gender, bias: Record<string, number> = {}): MatchResult {
  const candidates = samgukCharacters
    .filter((c) => c.gender === gender)
    .map((c) => {
      const d = distance(z, characterProfiles[c.id])
      return { c, d, score: d + (bias[c.id] ?? 0) }
    })
    .sort((a, b) => a.score - b.score || a.c.id.localeCompare(b.c.id))
  const { c, d } = candidates[0]
  const p = characterProfiles[c.id]
  return {
    name: c.name,
    matchReason: buildReason(z, p, c),
    // 실측 30장 기준 거리 d는 대략 2~4 → 중간값 약 80%, 70~98%로 표시
    similarity: Math.max(70, Math.min(98, Math.round(99 - 7 * d))),
    faceAnalysis: buildAnalysis(z),
    character: c,
  }
}

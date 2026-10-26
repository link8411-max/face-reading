import { FEATURE_KEYS, type FeatureKey } from '@/lib/face/landmarkFeatures'
import type { ZVector } from '@/lib/face/featureStats'
import { samgukCharacters, type SamgukCharacter } from '@/lib/samgukDB'
import { characterProfiles, type CharacterProfile } from './profiles'
import { characterVibes } from './vibes'

export type { Gender } from '@/lib/face/featureStats'
import type { Gender } from '@/lib/face/featureStats'

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
// 양쪽 모두 칭찬·인상으로 쓴다. 측정 결과를 그대로 읊으면 외모 지적처럼 읽히기 때문이다.
export const PHRASES: Record<FeatureKey, [string, string]> = {
  eyeAspect: ['맑고 또렷한 눈', '그윽하고 깊은 눈매'],
  eyeTilt: ['당당하게 올라간 눈꼬리', '선하고 부드러운 눈꼬리'],
  eyeWidth: ['시원하게 뻗은 눈매', '야무지고 단정한 눈매'],
  eyeSpacing: ['마음이 너그러워 보이는 시원한 미간', '집중력이 느껴지는 또렷한 미간'],
  browGap: ['여유롭고 온화한 눈썹', '결단력이 느껴지는 강렬한 눈썹'],
  browTilt: ['힘 있게 뻗은 눈썹', '부드럽고 온화한 눈썹'],
  noseLength: ['기품 있게 뻗은 콧대', '귀엽고 단정한 코'],
  noseWidth: ['복이 깃든 넉넉한 콧방울', '오똑하고 세련된 코'],
  mouthWidth: ['시원하고 호탕한 입매', '단정하고 고운 입매'],
  lipFullness: ['정이 많아 보이는 도톰한 입술', '깔끔하고 단정한 입술'],
  mouthCornerLift: ['밝은 기운이 도는 입꼬리', '진중하고 믿음직한 입매'],
  faceAspect: ['기품 있는 갸름한 얼굴선', '듬직하고 안정감 있는 얼굴선'],
  jawWidth: ['의지가 굳어 보이는 다부진 턱선', '부드럽고 갸름한 턱선'],
  chinLength: ['안정감 있는 턱선', '어려 보이는 동안 턱선'],
  midfaceRatio: ['균형 잡힌 기품 있는 이목구비', '오밀조밀 귀여운 이목구비'],
}

const phrase = (k: FeatureKey, v: number) => PHRASES[k][v >= 0 ? 0 : 1]

// 풀이에 쓸 만큼 뚜렷하되(0.5 이상), 한쪽 끝에 많이 치우치지 않은(2 이하) 특징만 쓴다.
// 아주 두드러진 특징일수록 본인이 신경 쓰는 부분일 가능성이 크다.
const NOTABLE = 0.5
const TOO_STRONG = 2
const usable = (v: number) => Math.abs(v) >= NOTABLE && Math.abs(v) <= TOO_STRONG

const GROUPS: Record<'눈' | '코' | '입' | '얼굴형', { keys: FeatureKey[]; balanced: string }> = {
  눈: { keys: ['eyeAspect', 'eyeTilt', 'eyeWidth', 'eyeSpacing', 'browTilt', 'browGap'], balanced: '조화로운 눈매' },
  코: { keys: ['noseLength', 'noseWidth'], balanced: '반듯한 코' },
  입: { keys: ['mouthWidth', 'lipFullness', 'mouthCornerLift'], balanced: '단정한 입매' },
  얼굴형: { keys: ['faceAspect', 'jawWidth', 'chinLength', 'midfaceRatio'], balanced: '균형 잡힌 얼굴선' },
}

// 받침 유무로 조사 고르기 (과/와, 을/를, 이/가)
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasBatchim ? withBatchim : without)
}

// 장수의 대표 특징 중 사용자와 같은 방향인 것을 우선, 없으면 사용자의 뚜렷한 특징 중에서 고른다
function pickFeatures(z: ZVector, p: CharacterProfile, keys: readonly FeatureKey[] = FEATURE_KEYS): FeatureKey[] {
  const shared = keys
    .filter((k) => p.z[k] !== undefined && Math.sign(z[k]) === Math.sign(p.z[k]!) && Math.abs(z[k]) >= 0.3 && Math.abs(z[k]) <= TOO_STRONG)
    .sort((a, b) => (p.weight[b] ?? 1) - (p.weight[a] ?? 1) || Math.abs(z[b]) - Math.abs(z[a]))
  const own = keys.filter((k) => !shared.includes(k) && usable(z[k])).sort((a, b) => Math.abs(z[b]) - Math.abs(z[a]))
  return [...shared, ...own]
}

function buildReason(z: ZVector, p: CharacterProfile, c: SamgukCharacter): string {
  // 인물 외모 묘사(appearance)에는 부정적 표현이 섞여 있어 좋은 기질 문장을 쓴다
  const vibe = `${josa(characterVibes[c.id], '이', '가')} 느껴지는 인상이에요.`
  const shared = pickFeatures(z, p).filter((k) => p.z[k] !== undefined && Math.sign(z[k]) === Math.sign(p.z[k]!)).slice(0, 2)
  // 공유하는 대표 특징이 없으면 특정 특징을 단정하지 않는다
  if (shared.length === 0) {
    return `${c.name}처럼 전체적인 얼굴 비율이 닮았어요. ${vibe}`
  }
  const traits = shared.map((k) => phrase(k, z[k]))
  const joined = traits.length === 2 ? `${josa(traits[0], '과', '와')} ${traits[1]}` : traits[0]
  return `${c.name}처럼 ${josa(joined, '이', '가')} 닮았어요. ${vibe}`
}

function buildAnalysis(z: ZVector, p: CharacterProfile): MatchResult['faceAnalysis'] {
  const out = {} as MatchResult['faceAnalysis']
  for (const [group, { keys, balanced }] of Object.entries(GROUPS) as [keyof typeof GROUPS, (typeof GROUPS)[keyof typeof GROUPS]][]) {
    const k = pickFeatures(z, p, keys).find((key) => usable(z[key]))
    out[group] = k ? phrase(k, z[k]) : balanced
  }
  const top = pickFeatures(z, p).find((k) => usable(z[k]))
  out.인상 = top
    ? `${josa(phrase(top, z[top]), '이', '가')} 돋보이는 첫인상이에요`
    : '어느 한 곳 튀지 않고 조화로운 첫인상이에요'
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
    faceAnalysis: buildAnalysis(z, p),
    character: c,
  }
}

// 결과별 공유 링크와 1인칭 공유 문구.
// 링크에는 결과 유형 키와 점수(정수)만 담는다. 이름·사진·생년월일·얼굴 수치는 넣지 않는다.
// 유형 키는 허용 목록으로 검증하고 점수는 50~99로 제한한다. 잘못된 값이면 null → 테스트 시작 화면으로 보낸다.
import { animalTypeDB } from '@/lib/animalTypeDB'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import { samgukCharacters } from '@/lib/samgukDB'
import { compatSummary, isMbti } from '@/lib/mbti/compat'

export const SITE = 'https://unse-ai.com'
export type ShareKind = 'animal' | 'samguk' | 'face'

const FACE_TYPES: Record<string, string> = { wealth: '재물상', blessing: '복덕상', leader: '리더상', noble: '귀인상', scholar: '학자상', artist: '예술가상' }
const TEST_PATH: Record<ShareKind, string> = { animal: '/animal', samguk: '/samguk', face: '/face2' }
export const TEST_NAME: Record<ShareKind, string> = { animal: '동물상 테스트', samguk: '나는 삼국지 속 누구?', face: 'AI 관상 테스트' }

export function faceSlug(type: string): string | null {
  return Object.entries(FACE_TYPES).find(([, v]) => v === type)?.[0] ?? null
}

export function clampScore(s: unknown): number | null {
  const n = typeof s === 'number' ? s : typeof s === 'string' && s.trim() !== '' ? Number(s) : NaN
  return Number.isFinite(n) ? Math.max(50, Math.min(99, Math.round(n))) : null
}

// 받침 유무로 조사 고르기
export const josa = (w: string, withB: string, without: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00
  return w + (c >= 0 && c <= 11171 && c % 28 !== 0 ? withB : without)
}

export interface SharedResult {
  kind: ShareKind
  key: string
  score: number | null
  name: string // 결과 이름 (고양이상, 조운, 재물상)
  phrase: string // 1인칭 공유 문구
  testPath: string
  image?: string // 삼국지 도트 초상화
}

export function parseShared(kind: ShareKind, key: string, s?: unknown): SharedResult | null {
  const base = { kind, key, testPath: TEST_PATH[kind] }
  if (kind === 'face') {
    const name = FACE_TYPES[key]
    return name ? { ...base, score: null, name, phrase: `나는 ${josa(name, '이래', '래')}. 너 관상도 봐줄까?` } : null
  }
  const score = clampScore(s)
  if (score === null) return null
  if (kind === 'animal') {
    if (!(ANIMAL_KEYS as readonly string[]).includes(key)) return null
    const name = animalTypeDB[key].name
    return { ...base, score, name, phrase: `나는 ${name} ${score}% 나왔어. 너는 무슨 상이야?` }
  }
  const c = samgukCharacters.find((x) => x.id === key)
  if (!c) return null
  return { ...base, score, name: c.name, image: `/images/samguk/${c.name}.jpg`, phrase: `나는 ${josa(c.name, '이랑', '랑')} ${score}% 닮았대. 너는 삼국지 속 누구야?` }
}

const UTM = (campaign: string) => `utm_source=share&utm_medium=friend_link&utm_campaign=${campaign}`

export function shareUrl(kind: ShareKind, key: string, score?: number): string {
  const s = kind === 'face' || score === undefined ? null : clampScore(score)
  return `${SITE}${TEST_PATH[kind]}/r/${encodeURIComponent(key)}?${s !== null ? `s=${s}&` : ''}${UTM(kind)}`
}

export function mbtiShared(a: string, b: string): { a: string; b: string; score: number; phrase: string; url: string } | null {
  if (!isMbti(a) || !isMbti(b)) return null
  const score = compatSummary(a, b).total
  return { a, b, score, phrase: `${a}랑 ${b} 궁합 ${score}점이래. 우리도 해볼까?`, url: `${SITE}/mbti/match?a=${a}&b=${b}&${UTM('mbti_match')}` }
}

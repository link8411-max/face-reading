// 결과별 공유 링크와 1인칭 공유 문구.
// 링크에는 결과 유형 키와 점수(정수)만 담는다. 이름·사진·생년월일·얼굴 수치는 넣지 않는다.
// 유형 키는 허용 목록으로 검증하고 점수는 50~99로 제한한다. 잘못된 값이면 null → 테스트 시작 화면으로 보낸다.
import { animalTypeDB } from '@/lib/animalTypeDB'
import { ANIMAL_KEYS } from '@/lib/animal/matcher'
import { samgukCharacters } from '@/lib/samgukDB'
import { compatSummary, isMbti, type MbtiType } from '@/lib/mbti/compat'
import { faceMatch, REL, REL_NAME, type Rel } from '@/lib/faceMatch/compat'
import type { AnimalKey } from '@/lib/animal/matcher'
import { josa } from '@/lib/josa'
import { SITE, UTM } from '@/lib/shareBase'
import { localePath, type Locale } from '@/lib/i18n/locales'
import { GUANSANG_TYPES, LEGACY_FACE_KEYS } from '@/content/guansang'
import { isGuansangTypeKey } from '@/lib/face/guansangKeys'
import { STEM_BY_KEY } from '@/lib/saju/keys'
import { DAY_MASTER_COPY } from '@/content/saju'

// 기존 호출처를 위해 다시 내보낸다. 일기토 공유 링크는 @/lib/duel/share (일기토 규칙이 다른 페이지에 실리지 않게)
export { josa, SITE }
export type ShareKind = 'animal' | 'samguk' | 'face' | 'saju'

export const FACE_TYPES: Record<string, string> = Object.fromEntries(Object.entries(GUANSANG_TYPES).map(([k, v]) => [k, v.nickname]))
const TEST_PATH: Record<ShareKind, string> = { animal: '/animal', samguk: '/samguk', face: '/face2', saju: '/saju' }
export const TEST_NAME: Record<ShareKind, string> = { animal: '동물상 테스트', samguk: '나는 삼국지 속 누구?', face: 'AI 관상 테스트', saju: '내 사주 풀이' }

export function faceSlug(type: string): string | null {
  return Object.entries(FACE_TYPES).find(([, v]) => v === type)?.[0] ?? null
}

export function clampScore(s: unknown): number | null {
  const n = typeof s === 'number' ? s : typeof s === 'string' && s.trim() !== '' ? Number(s) : NaN
  return Number.isFinite(n) ? Math.max(50, Math.min(99, Math.round(n))) : null
}

// 동물상·관상 공유 링크의 그림 성별. f|m만 받고 그 밖의 값은 버린다(착지는 f로 보인다)
export type ArtG = 'f' | 'm'
export const parseG = (g: unknown): ArtG | undefined => (g === 'f' || g === 'm' ? g : undefined)

export interface SharedResult {
  kind: ShareKind
  key: string
  score: number | null
  name: string // 결과 이름 (고양이상, 조운, 재물상)
  phrase: string // 1인칭 공유 문구
  testPath: string
  image?: string // 삼국지 도트 초상화
  g?: ArtG // 동물상·관상: 링크에 담긴 그림 성별(없으면 착지가 f로 보여 준다)
}

export function parseShared(kind: ShareKind, key: string, s?: unknown, g?: unknown): SharedResult | null {
  const base = { kind, key, testPath: TEST_PATH[kind] }
  if (kind === 'face') {
    // 객체 프로토타입 키(constructor 등)를 막으려 자기 키만 본다
    // 옛 공유 링크(wealth 등 6개)는 새 유형 키로 옮겨 착지한다
    const k = Object.hasOwn(LEGACY_FACE_KEYS, key) ? LEGACY_FACE_KEYS[key] : key
    if (!isGuansangTypeKey(k)) return null
    const name = FACE_TYPES[k]
    return { ...base, key: k, score: null, name, g: parseG(g), phrase: `나는 ${josa(name, '이래', '래')}. 너 관상도 봐줄까?` }
  }
  if (kind === 'saju') {
    // 공유 링크에는 일간 10키만 담는다 (생년월일·사주 글자 없음)
    if (!Object.hasOwn(STEM_BY_KEY, key)) return null
    const title = DAY_MASTER_COPY[STEM_BY_KEY[key]].title
    const noun = title.replace(/^나는 /, '').replace(/(이에요|예요)$/, '')
    return { ...base, score: null, name: title, phrase: `나는 ${josa(noun, '이래', '래')}. 너는?` }
  }
  const score = clampScore(s)
  if (score === null) return null
  if (kind === 'animal') {
    if (!(ANIMAL_KEYS as readonly string[]).includes(key)) return null
    const name = animalTypeDB[key].name
    return { ...base, score, name, g: parseG(g), phrase: `나는 ${name} ${score}% 나왔어. 너는 무슨 상이야?` }
  }
  const c = samgukCharacters.find((x) => x.id === key)
  if (!c) return null
  return { ...base, score, name: c.name, image: `/images/samguk/${c.name}.jpg`, phrase: `나는 ${josa(c.name, '이랑', '랑')} ${score}% 닮았대. 너는 삼국지 속 누구야?` }
}

export function shareUrl(kind: ShareKind, key: string, score?: number, locale: Locale = 'ko', extra?: { g?: ArtG }): string {
  const s = kind === 'face' || kind === 'saju' || score === undefined ? null : clampScore(score)
  const g = kind === 'animal' || kind === 'face' ? parseG(extra?.g) : undefined
  return `${SITE}${localePath(locale, TEST_PATH[kind])}/r/${encodeURIComponent(key)}?${s !== null ? `s=${s}&` : ''}${g ? `g=${g}&` : ''}${UTM(kind)}`
}

// MBTI 궁합 공유 링크는 계산기(/mbti/match, 검색 노출·정적)와 다른 주소 /mbti/r/infp-entj (검색 제외)
export function mbtiShared(aIn: string, bIn: string): { a: string; b: string; score: number; phrase: string; url: string; path: string } | null {
  const a = aIn.toUpperCase(), b = bIn.toUpperCase()
  if (!isMbti(a) || !isMbti(b)) return null
  const score = compatSummary(a, b).total
  const path = `/mbti/r/${a.toLowerCase()}-${b.toLowerCase()}`
  return { a, b, score, phrase: `${a}랑 ${b} 궁합 ${score}점이래. 우리도 해볼까?`, path, url: `${SITE}${path}?${UTM('mbti_match')}` }
}

// 결과 미리보기 이미지 주소 (카톡·인스타 미리보기, 카카오톡 공유 카드)
export function ogImageUrl(kind: ShareKind | 'mbti', key: string, score?: number | null, b?: string, locale: Locale = 'ko'): string {
  if (kind === 'mbti') return `${SITE}/api/og/result?kind=mbti&a=${key}&b=${b}`
  return `${SITE}/api/og/result?kind=${kind}&key=${encodeURIComponent(key)}${score !== undefined && score !== null ? `&s=${score}` : ''}${locale === 'ko' ? '' : `&lang=${locale}`}`
}

// ===== 얼굴 궁합 (8단계) =====

const isAnimal = (k: string): k is AnimalKey => (ANIMAL_KEYS as readonly string[]).includes(k)
export const isRel = (r: string): r is Rel => (REL as readonly string[]).includes(r)

export function faceMatchUrl(a: AnimalKey, b: AnimalKey, rel: Rel, locale: Locale = 'ko'): string {
  return `${SITE}${localePath(locale, '/face-match')}/r/${a}-${b}?rel=${rel}&${UTM('face_match')}`
}

// 짝사랑은 초대 링크를 만들지 않는다 (상대에게 보내는 순간 짝사랑이 아니다)
export function faceMatchInviteUrl(key: AnimalKey, rel: Rel): string | null {
  return rel === 'crush' ? null : `${SITE}/face-match/i/${key}?rel=${rel}&${UTM('face_match_invite')}`
}

export function parseFaceMatch(pair: string, rel: string) {
  const parts = pair.split('-')
  if (parts.length !== 2) return null
  const [a, b] = parts
  if (!isAnimal(a) || !isAnimal(b) || !isRel(rel)) return null
  const r = faceMatch(a, b, rel)
  const phrase = rel === 'crush' ? `나 짝사랑 성공 가능성 ${r.score}% 나왔어. 너도 해볼래?` : `우리 ${REL_NAME[rel]} 궁합 ${r.score}점이래. 너희도 해볼래?`
  return { a, b, rel, score: r.score, result: r, phrase, aName: animalTypeDB[a].name, bName: animalTypeDB[b].name }
}

export function parseInvite(key: string, rel: string) {
  if (!isAnimal(key) || !isRel(rel) || rel === 'crush') return null
  const name = animalTypeDB[key].name
  return { key, rel, name, who: rel === 'lover' ? '내 사람' : '친구', phrase: `나는 ${name}이야. 우리 ${REL_NAME[rel]} 궁합 볼래?` }
}

// ===== 우리 팀 삼국지 (8단계) =====
// 링크에는 장수 id 2~6개만 담는다(중복 허용). 별칭은 넣지 않는다.
export function teamUrl(ids: string[]): string {
  return `${SITE}/samguk/team/r/${ids.join('-')}?${UTM('team_samguk')}`
}

export function parseTeam(path: string) {
  const ids = path.split('-')
  if (ids.length < 2 || ids.length > 6) return null
  const members = ids.map((id) => samgukCharacters.find((c) => c.id === id))
  if (members.some((m) => !m)) return null
  return { ids, members: members as NonNullable<(typeof members)[number]>[] }
}

// ===== 오늘의 MBTI 운세 =====
// 링크에는 유형(소문자)과 utm만, 날짜는 넣지 않는다 (받은 사람이 연 날의 오늘 운세를 본다)
export function mbtiDailyUrl(t: MbtiType): string {
  return `${SITE}/fortune/mbti/r/${t.toLowerCase()}?${UTM('mbti_daily')}`
}

export function parseMbtiDailyKey(key: string): MbtiType | null {
  const up = key.toUpperCase()
  return key === key.toLowerCase() && isMbti(up) ? up : null
}

export const mbtiDailyPhrase = (t: MbtiType, headline: string) => `오늘 ${t} 운세는 '${headline}'래. 너는 무슨 유형이야?`

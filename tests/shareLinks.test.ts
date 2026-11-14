import { GUANSANG_TYPES, LEGACY_FACE_KEYS } from '@/content/guansang'
import { GUANSANG_TYPE_KEYS } from '@/lib/face/guansangKeys'
import { parseShared, shareUrl, clampScore, faceSlug, mbtiShared, parseMbtiGenders } from '@/lib/shareLinks'

test('점수는 정수 50~99로 제한, 숫자가 아니면 null', () => {
  expect(clampScore('87')).toBe(87)
  expect(clampScore('120')).toBe(99)
  expect(clampScore('3')).toBe(50)
  expect(clampScore('86.6')).toBe(87)
  expect(clampScore('abc')).toBeNull()
  expect(clampScore(undefined)).toBeNull()
})

test('동물상: 1인칭 문구, 허용 목록 밖이면 null', () => {
  const r = parseShared('animal', 'cat', '87')!
  expect(r.phrase).toBe('나는 고양이상 87% 나왔어. 너는 무슨 상이야?')
  expect(r.testPath).toBe('/animal')
  expect(r.name).toBe('고양이상')
  expect(parseShared('animal', 'unicorn', '87')).toBeNull()
  expect(parseShared('animal', 'cat', 'x')).toBeNull()
})

test('삼국지: 받침에 맞는 조사(이랑/랑)', () => {
  expect(parseShared('samguk', 'zhaoyun', '84')!.phrase).toBe('나는 조운이랑 84% 닮았대. 너는 삼국지 속 누구야?')
  expect(parseShared('samguk', 'caocao', '90')!.phrase).toBe('나는 조조랑 90% 닮았대. 너는 삼국지 속 누구야?')
  expect(parseShared('samguk', '../../etc', '84')).toBeNull()
})

test('관상: 별명을 키로, 점수 없이', () => {
  expect(faceSlug('곳간이 든든한 상')).toBe('earth-mid')
  expect(faceSlug('없는상')).toBeNull()
  const r = parseShared('face', 'earth-mid')!
  expect(r.phrase).toBe('나는 곳간이 든든한 상이래. 너 관상도 봐줄까?')
  expect(r.testPath).toBe('/face2')
})

test('관상: 새 15키 전부 통과, 옛 6키는 새 키로 착지, 모르는 키는 null', () => {
  for (const k of GUANSANG_TYPE_KEYS) {
    const r = parseShared('face', k)!
    expect(r.key).toBe(k)
    expect(r.name).toBe(GUANSANG_TYPES[k].nickname)
  }
  for (const [old, now] of Object.entries(LEGACY_FACE_KEYS)) {
    const r = parseShared('face', old)!
    expect(r.key).toBe(now)
    expect(r.name).toBe(GUANSANG_TYPES[now].nickname)
  }
  const w = parseShared('face', 'wealth')!
  expect(w.name).toBe('곳간이 든든한 상')
  expect(parseShared('face', 'nothing-here')).toBeNull()
})

test('MBTI 궁합: 두 유형 검증, 점수는 계산값', () => {
  const r = mbtiShared('INFP', 'ENTJ')!
  expect(r.phrase).toBe('INFP랑 ENTJ 궁합 100점이래. 우리도 해볼까?')
  expect(mbtiShared('INFP', 'XXXX')).toBeNull()
})

test('공유 주소: 유형 키와 점수, 유입 구분용 utm만 담는다', () => {
  const u = new URL(shareUrl('animal', 'cat', 86.6))
  expect(u.origin + u.pathname).toBe('https://unse-ai.com/animal/r/cat')
  expect(Object.fromEntries(u.searchParams)).toEqual({ s: '87', utm_source: 'share', utm_medium: 'friend_link', utm_campaign: 'animal' })
  expect(new URL(shareUrl('face', 'earth-mid')).searchParams.has('s')).toBe(false)
})

test('동물상 공유 주소에 그림 성별 g(f|m)를 담고, 파서는 f|m만 받는다', () => {
  expect(shareUrl('animal', 'cat', 88, 'ko', { g: 'm' })).toBe('https://unse-ai.com/animal/r/cat?s=88&g=m&utm_source=share&utm_medium=friend_link&utm_campaign=animal')
  expect(shareUrl('animal', 'cat', 88)).not.toContain('g=')
  // 관상도 그림 성별 g를 담는다(점수 s는 없음)
  expect(shareUrl('face', 'earth-mid', undefined, 'ko', { g: 'm' })).toBe('https://unse-ai.com/face2/r/earth-mid?g=m&utm_source=share&utm_medium=friend_link&utm_campaign=face')
  expect(shareUrl('face', 'earth-mid')).not.toContain('g=')
  expect(shareUrl('face', 'earth-mid', undefined, 'ko', { g: 'x' as never })).not.toContain('g=')
  expect(shareUrl('saju', 'gyeong', undefined, 'ko', { g: 'm' })).not.toContain('g=')
  expect(parseShared('animal', 'cat', '88', 'm')!.g).toBe('m')
  expect(parseShared('animal', 'cat', '88', 'f')!.g).toBe('f')
  for (const bad of ['x', '../etc', 'M', '', undefined, ['m', 'f']]) expect(parseShared('animal', 'cat', '88', bad)!.g, String(bad)).toBeUndefined()
})

// 리뷰 Important: 객체 프로토타입 키(constructor 등)로 500이 나지 않는다
test.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])('관상 링크 키 %s는 허용 목록 밖이다', (k) => {
  expect(parseShared('face', k)).toBeNull()
  expect(parseShared('animal', k, '80')).toBeNull()
  expect(parseShared('samguk', k, '80')).toBeNull()
})

test('MBTI 공유 링크는 계산기와 다른 주소(/mbti/r/a-b)로, 대소문자 무관', () => {
  expect(new URL(mbtiShared('INFP', 'ENTJ')!.url).pathname).toBe('/mbti/r/infp-entj')
  expect(mbtiShared('infp', 'entj')?.a).toBe('INFP')
})

import { STEM_KEY } from '@/lib/saju/keys'
import { DAY_MASTER_COPY } from '@/content/saju'
import { STEMS } from '@/lib/saju/keys'

test('사주: 일간 10키 전부 통과, 모르는 키는 null, 링크에 점수 없음', () => {
  for (const st of STEMS) {
    const r = parseShared('saju', STEM_KEY[st])!
    expect(r.name).toBe(DAY_MASTER_COPY[st].title)
    expect(r.phrase).toMatch(/^나는 .+(이래|래)\. 너는\?$/)
    expect(r.phrase).not.toContain('나는 나는')
    expect(r.testPath).toBe('/saju')
  }
  expect(parseShared('saju', 'bogus')).toBeNull()
  expect(parseShared('saju', 'constructor')).toBeNull()
  expect(shareUrl('saju', 'gyeong', 80)).toBe('https://unse-ai.com/saju/r/gyeong?utm_source=share&utm_medium=friend_link&utm_campaign=saju')
})

test('MBTI 궁합 공유 링크는 두 캐릭터 성별(g=fm)을 싣고, 틀린 값은 버린다', () => {
  const u = new URL(mbtiShared('INFP', 'ENTJ', ['f', 'm'])!.url)
  expect(u.searchParams.get('g')).toBe('fm')
  expect(new URL(mbtiShared('INFP', 'ENTJ')!.url).searchParams.get('g')).toBeNull()
  expect(parseMbtiGenders('mf')).toEqual(['m', 'f'])
  for (const bad of ['', 'f', 'fx', 'fmf', null, undefined]) expect(parseMbtiGenders(bad)).toBeNull()
})

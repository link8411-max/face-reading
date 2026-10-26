import { parseShared, shareUrl, clampScore, faceSlug, mbtiShared } from '@/lib/shareLinks'

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

test('관상: 한글 유형을 영문 키로, 점수 없이', () => {
  expect(faceSlug('재물상')).toBe('wealth')
  expect(faceSlug('없는상')).toBeNull()
  const r = parseShared('face', 'wealth')!
  expect(r.phrase).toBe('나는 재물상이래. 너 관상도 봐줄까?')
  expect(r.testPath).toBe('/face2')
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
  expect(new URL(shareUrl('face', 'wealth')).searchParams.has('s')).toBe(false)
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

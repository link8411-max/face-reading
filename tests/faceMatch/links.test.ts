import { parseFaceMatch, parseInvite, faceMatchUrl, faceMatchInviteUrl } from '@/lib/shareLinks'

test('결과 링크: 두 동물상·관계만, 허용 목록 검증', () => {
  const u = new URL(faceMatchUrl('cat', 'fox', 'lover'))
  expect(u.pathname).toBe('/face-match/r/cat-fox')
  expect(u.searchParams.get('rel')).toBe('lover')
  expect(u.searchParams.get('utm_source')).toBe('share')
  expect(parseFaceMatch('cat-fox', 'lover')!.phrase).toMatch(/^우리 연인 궁합 \d+점이래\. 너희도 해볼래\?$/)
  expect(parseFaceMatch('cat-fox', 'crush')!.phrase).toMatch(/^나 짝사랑 성공 가능성 \d+% 나왔어\. 너도 해볼래\?$/)
  expect(parseFaceMatch('cat-unicorn', 'lover')).toBeNull()
  expect(parseFaceMatch('cat-fox', 'enemy')).toBeNull()
  expect(parseFaceMatch('constructor-fox', 'friend')).toBeNull()
})

test('같은 두 동물상·관계면 링크 순서와 상관없이 같은 점수', () => {
  expect(parseFaceMatch('cat-fox', 'friend')!.score).toBe(parseFaceMatch('fox-cat', 'friend')!.score)
})

test('초대 링크: 친구·연인만, 짝사랑은 만들지 않는다', () => {
  expect(new URL(faceMatchInviteUrl('cat', 'friend')!).pathname).toBe('/face-match/i/cat')
  expect(faceMatchInviteUrl('cat', 'crush')).toBeNull()
  expect(parseInvite('cat', 'lover')!.phrase).toBe('나는 고양이상이야. 우리 연인 궁합 볼래?')
  expect(parseInvite('cat', 'crush')).toBeNull()
  expect(parseInvite('unicorn', 'friend')).toBeNull()
})

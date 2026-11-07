import { branchRelationToMi, stemTenGod } from '@/lib/saju/relations'

test.each([
  ['축', '충', 'strong'],
  ['오', '합', 'strong'],
  ['묘', '반합', 'weak'],
  ['해', '반합', 'weak'],
  ['술', '파', 'weak'],
  ['자', '해', 'weak'],
  ['미', '같음', 'weak'],
  ['인', '없음', 'none'],
  ['진', '없음', 'none'],
  ['신', '없음', 'none'],
] as const)('일지 %s ↔ 미 = %s(%s)', (b, kind, strength) => {
  expect(branchRelationToMi(b)).toEqual({ kind, strength })
})

test('세운 천간 십신', () => {
  expect(stemTenGod('갑', '정')).toBe('상관')
  expect(stemTenGod('경', '정')).toBe('정관')
  expect(stemTenGod('경', '경')).toBe('비견')
})

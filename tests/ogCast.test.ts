import { readFileSync } from 'node:fs'
test('결과 미리보기 이미지가 종류별 캐릭터를 쓴다', async () => {
  const src = readFileSync('src/app/api/og/result/route.tsx', 'utf8')
  expect(src).toMatch(/castForKind/)
  const { castForKind } = await import('@/lib/ogCast')
  expect(castForKind('face')).toBe('haetae')
  expect(castForKind('animal')).toBe('tiger')
  for (const k of ['mbti', 'mbti-daily', 'face-match']) expect(castForKind(k)).toBe('gumiho')
  expect(castForKind('exam')).toBe('dokkaebi')
  for (const k of ['samguk', 'bujeok', 'cup', 'duel']) expect(castForKind(k), k).toBeNull()
})
test('일반 미리보기의 cast 매개변수는 허용 목록만', async () => {
  const { castParam } = await import('@/lib/ogCast')
  expect(castParam('saja')).toBe('saja'); expect(castParam('../x')).toBe('haetae'); expect(castParam(null)).toBe('haetae')
  expect(castParam('constructor')).toBe('haetae'); expect(castParam('toString')).toBe('haetae')
})
test('두 미리보기 경로는 그림을 못 받아도 그릴 수 있다(받은 경우에만 그림을 쓴다)', () => {
  for (const f of ['src/app/api/og/route.tsx', 'src/app/api/og/result/route.tsx']) expect(readFileSync(f, 'utf8'), f).toContain('loadCastImage')
})
test('미리보기 스타일에 undefined 값이 없다(satori가 undefined.trim()으로 터진다)', () => {
  for (const f of ['src/app/api/og/route.tsx', 'src/app/api/og/result/route.tsx']) expect(readFileSync(f, 'utf8'), f).not.toMatch(/\w+: [^,{}]*\? [^,{}]* : undefined/)
})

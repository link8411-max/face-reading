import { 한마디, 띠한마디, 영역문장, 영역보강, 천간근거, 지지근거, 오행근거, 영역목록 } from '@/content/dailyFortuneText'
import { 천간관계목록, 지지관계목록 } from '@/lib/dailyEngine/relations'

const ok = (s: string, min = 8) => typeof s === 'string' && s.trim().length >= min && !s.includes('undefined')

test('한마디 42 + 띠 6, 전부 채워져 있고 해요체', () => {
  for (const a of 천간관계목록) for (const b of 지지관계목록) {
    expect(ok(한마디[a][b]), `${a}×${b}`).toBe(true)
    expect(한마디[a][b]).toMatch(/요\.$|요!$/)
  }
  for (const b of 지지관계목록) expect(ok(띠한마디[b])).toBe(true)
  expect(한마디.합.충).toBe('뜻은 맞는데 일은 꼬이는 날이에요. 약속은 오후로 미뤄요.')
  expect(한마디.인성.육합).toBe('누군가 손 내미는 날이에요. 받으세요.')
})

test('영역 문장 12 + 보강 7, 보강의 영역·방향은 스펙과 같다', () => {
  for (const 영 of 영역목록) for (const 상 of ['좋음', '보통', '조심'] as const) expect(ok(영역문장[영][상], 6)).toBe(true)
  expect(영역보강.재성).toMatchObject({ 영역: '재물', 방향: 1 })
  expect(영역보강.식상).toMatchObject({ 영역: '연애', 방향: 1 })
  expect(영역보강.인성).toMatchObject({ 영역: '건강', 방향: 1 })
  expect(영역보강.관살).toMatchObject({ 영역: '일', 방향: -1 })
  expect(영역보강.비겁).toMatchObject({ 영역: '재물', 방향: -1 })
  expect(영역보강.합).toMatchObject({ 영역: '연애', 방향: 1 })
  expect(영역보강.충).toMatchObject({ 영역: '일', 방향: -1 })
})

test('근거 문장 틀에 글자가 들어간다', () => {
  expect(천간근거.합({ 내천간: '갑', 내오행: '목', 일간: '기', 일간오행: '토' })).toBe('당신의 갑(목)과 오늘의 기(토)은 서로 합해요(갑기합)')
  expect(지지근거.충({ 내지지: '자', 띠: '쥐', 일지: '오' })).toBe('자(쥐)와 오는 정면으로 맞서요(자오충)')
  expect(오행근거.인성({ 띠: '말', 띠오행: '화', 일간: '갑', 일간오행: '목' })).toContain('목생화')
})

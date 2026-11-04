import { championPath, currentMatch, matchNumber, pick, progressLabel, ratioMessage, startCup } from '@/lib/cup/game'

const ids = Array.from({ length: 16 }, (_, i) => `p${i}`)
const playLeft = (s: ReturnType<typeof startCup>) => { while (currentMatch(s)) s = pick(s, currentMatch(s)![0]); return s }

test('16강은 15번 고르면 끝난다', () => {
  let s = startCup(ids); let n = 0
  while (currentMatch(s)) { s = pick(s, currentMatch(s)![0]); n++ }
  expect(n).toBe(15); expect(s.champion).toBe('p0')
})
test('진행 표시', () => {
  let s = startCup(ids)
  expect(progressLabel(s, '최강 무장')).toBe('최강 무장 16강 · 1/8')
  s = pick(s, 'p0'); s = pick(s, 'p2')
  expect(progressLabel(s, '최강 무장')).toBe('최강 무장 16강 · 3/8')
  expect(matchNumber(s)).toBe(3)
})
test('8강 판', () => {
  const s = startCup(ids.slice(0, 8))
  expect(progressLabel(s, '삼국지 여인')).toBe('삼국지 여인 8강 · 1/4')
  expect(playLeft(s).champion).toBe('p0')
})
test('결승 표시와 우승 경로', () => {
  let s = startCup(ids.slice(0, 8))
  for (let i = 0; i < 6; i++) s = pick(s, currentMatch(s)![0])
  expect(progressLabel(s, '삼국지 여인')).toBe('삼국지 여인 결승')
  s = pick(s, currentMatch(s)![0])
  expect(championPath(s)).toEqual(['p1', 'p2', 'p4'])
})
test('현재 대결 밖 선택은 거부, 원래 상태는 그대로', () => {
  const s = startCup(ids)
  expect(() => pick(s, 'p5')).toThrow()
  expect(currentMatch(s)).toEqual(['p0', 'p1'])
})
test('시작 인원은 16 또는 8만', () => {
  expect(() => startCup(ids.slice(0, 10))).toThrow()
})
test('비율 문구', () => {
  expect(ratioMessage(null, 'guanyu', '관우')).toBe('')
  expect(ratioMessage('error', 'guanyu', '관우')).toBe('지금은 다른 사람 선택을 불러오지 못했어요')
  expect(ratioMessage({}, 'guanyu', '관우')).toBe('이 대결을 처음 골랐어요')
  expect(ratioMessage({ guanyu: 2, lvbu: 1 }, 'guanyu', '관우')).toBe('지금까지 3명이 이 대결을 골랐어요')
  expect(ratioMessage({ guanyu: 7, lvbu: 3 }, 'guanyu', '관우')).toBe('다른 사람들은 70%가 관우를 골랐어요')
  expect(ratioMessage({ lvbu: 9, guanyu: 2 }, 'lvbu', '여포')).toBe('다른 사람들은 82%가 여포를 골랐어요')
  expect(ratioMessage({ guanyu: 0, lvbu: 10 }, 'guanyu', '관우')).toBe('다른 사람들은 0%가 관우를 골랐어요')
})

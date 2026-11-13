import { existsSync } from 'node:fs'
import { CAST, castForHref } from '@/content/cast'

test('캐릭터(여섯 + 새 멤버 셋) 모두 그림 세 벌이 있다', () => {
  for (const c of Object.values(CAST)) for (const p of [c.img, c.face, c.og]) expect(existsSync(`public${p}`), p).toBe(true)
})
test('테스트 주소에 맞는 캐릭터', () => {
  expect(castForHref('/face2')).toBe('haetae')
  expect(castForHref('/fortune/daily')).toBe('sajaF')
  expect(castForHref('/today')).toBe('sajaF')
  expect(castForHref('/fortune')).toBe('sajaElder')
  expect(castForHref('/fortune/2027')).toBe('sajaElder')
  expect(castForHref('/fortune/2027/dog')).toBe('sajaElder')
  expect(castForHref('/fortune/mbti')).toBe('gumiho')
  expect(castForHref('/saju')).toBe('saja')
  expect(castForHref('/bujeok?mode=gift')).toBe('mudang')
  expect(castForHref('/exam/meme')).toBe('dokkaebi')
  expect(castForHref('/samguk')).toBeNull()
})

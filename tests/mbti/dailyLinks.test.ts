import { loadMbti, saveMbti } from '@/lib/mbtiMemory'
import { mbtiDailyUrl, parseMbtiDailyKey, mbtiDailyPhrase } from '@/lib/shareLinks'
import { ogQueryOk } from '@/lib/ogQuery'

function fakeStorage() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

test('고른 MBTI를 이 기기에 기억하고, 이상한 값·못 쓰는 저장소는 무시', () => {
  const s = fakeStorage()
  expect(loadMbti(s)).toBeNull()
  saveMbti('INFP', s)
  expect(loadMbti(s)).toBe('INFP')
  for (const bad of ['xxxx', 'infp', '']) { s.m.set('unse-mbti', bad); expect(loadMbti(s), bad).toBeNull() }
  const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
  expect(loadMbti(broken)).toBeNull()
  expect(() => saveMbti('INFP', broken)).not.toThrow()
})

test('공유 링크: 소문자 유형과 utm만, 날짜 없음', () => {
  const u = mbtiDailyUrl('INFP')
  expect(u).toBe('https://unse-ai.com/fortune/mbti/r/infp?utm_source=share&utm_medium=friend_link&utm_campaign=mbti_daily')
  expect(u).not.toMatch(/\d{4}/)
})

test('착지 유형 키: 소문자 4글자 허용 목록만', () => {
  expect(parseMbtiDailyKey('infp')).toBe('INFP')
  for (const bad of ['INFP', 'xxxx', 'constructor', '', 'infpp', '__proto__']) expect(parseMbtiDailyKey(bad), bad).toBeNull()
})

test('공유 문구: 1인칭, 오늘 한마디', () => {
  expect(mbtiDailyPhrase('INFP', '마음이 가는 일 하나를 골라 끝까지 해 보세요.')).toBe("오늘 INFP 운세는 '마음이 가는 일 하나를 골라 끝까지 해 보세요.'래. 너는 무슨 유형이야?")
})

test('미리보기 이미지 요청: 유형만, 날짜 매개변수는 거부', () => {
  expect(ogQueryOk(new URLSearchParams('kind=mbti-daily&type=infp'))).toBe(true)
  expect(ogQueryOk(new URLSearchParams('kind=mbti-daily&type=infp&date=2026-10-27'))).toBe(false)
})

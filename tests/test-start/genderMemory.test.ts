import { loadGender, saveGender } from '@/lib/genderMemory'

function fakeStorage() {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }
}

test('고른 성별을 이 기기에 기억했다가 다음 테스트에서 미리 고른다', () => {
  const s = fakeStorage()
  expect(loadGender(s)).toBeNull()
  saveGender('여', s)
  expect(loadGender(s)).toBe('여')
  saveGender('남', s)
  expect(loadGender(s)).toBe('남')
})

test('저장값이 이상하거나 저장소를 못 쓰면(사생활 보호 모드 등) 기억 없이 동작', () => {
  const s = fakeStorage()
  s.m.set('unse-gender', 'x')
  expect(loadGender(s)).toBeNull()
  const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
  expect(loadGender(broken)).toBeNull()
  expect(() => saveGender('여', broken)).not.toThrow()
  expect(loadGender(undefined)).toBeNull()
})

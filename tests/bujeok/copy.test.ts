import { expect, test } from 'vitest'
import { WISH_TEXT, EL_TEXT } from '@/content/bujeok'
import { WISHES, EL_KEYS } from '@/lib/bujeok/keys'
import { BANNED_PHRASES, EXEMPT_IN_HANJA_MEANING } from '@/lib/bujeok/bannedPhrases'

function strings(skip: string[] = []): string[] {
  const out: string[] = []
  for (const w of WISHES) for (const [k, v] of Object.entries(WISH_TEXT[w])) if (k !== 'hanja' && !skip.includes(k)) out.push(v)
  for (const e of EL_KEYS) out.push(...Object.values(EL_TEXT[e]))
  return out
}

test('금지어와 오행 한자가 없다 (hanja 필드 제외)', () => {
  for (const s of strings()) {
    for (const b of BANNED_PHRASES) if (!EXEMPT_IN_HANJA_MEANING.includes(b as never)) expect(s, s).not.toContain(b)
    expect(s, s).not.toMatch(/[木火土金水]/)
  }
  // '들어온다'는 효험 단정이라 한자 뜻풀이(실제 한자 문구의 번역)만 예외다
  for (const s of strings(['hanjaMeaning'])) for (const b of EXEMPT_IN_HANJA_MEANING) expect(s, s).not.toContain(b)
})

test('금지어 목록에 들어온다가 있고, 재물 귀여운 문구는 돈 모여라', () => {
  expect(BANNED_PHRASES).toContain('들어온다')
  expect(WISH_TEXT.money.cutePhrase).toBe('돈 모여라')
})

test('hanja는 실제 쓰이는 다섯 문구와 같다', () => {
  expect(WISH_TEXT.money.hanja).toBe('招財進寶')
  expect(WISH_TEXT.pass.hanja).toBe('金榜題名')
  expect(WISH_TEXT.health.hanja).toBe('無病長壽')
  expect(WISH_TEXT.love.hanja).toBe('天生緣分')
  expect(WISH_TEXT.guard.hanja).toBe('消災吉祥')
})

test('모든 문구가 비어 있지 않고 hanjaMeaning이 있다', () => {
  for (const w of WISHES) for (const v of Object.values(WISH_TEXT[w])) expect(v.length).toBeGreaterThan(0)
  for (const e of EL_KEYS) for (const v of Object.values(EL_TEXT[e])) expect(v.length).toBeGreaterThan(0)
})

test('화면 문구에 간지·십신 용어가 없다', () => {
  for (const s of strings()) expect(s, s).not.toMatch(/십신|천간|지지|일간|비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인/)
})

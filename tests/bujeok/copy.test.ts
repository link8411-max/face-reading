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

test('hanja는 설계 16절의 열한 문구와 정확히 같다', () => {
  const expected = {
    money: '招財進寶', pass: '金榜題名', health: '無病長壽', love: '天生緣分', guard: '消災吉祥',
    allgood: '萬事亨通', career: '立身揚名', business: '事業繁昌', family: '家和萬事成', samjae: '三災消滅', wish: '所願成就',
  }
  expect(WISHES).toHaveLength(11)
  expect(Object.keys(expected).sort()).toEqual([...WISHES].sort())
  for (const w of WISHES) expect(WISH_TEXT[w].hanja, w).toBe(expected[w])
  expect([...WISH_TEXT.family.hanja]).toHaveLength(5)
  for (const w of WISHES.filter((x) => x !== 'family')) expect([...WISH_TEXT[w].hanja], w).toHaveLength(4)
})

test('새 소원의 이름과 한글 뜻이 설계표와 같다', () => {
  expect(WISH_TEXT.allgood).toMatchObject({ label: '만사형통', hanjaMeaning: '모든 일이 뜻대로 술술 풀린다는 뜻이에요' })
  expect(WISH_TEXT.career).toMatchObject({ label: '취업·승진', hanjaMeaning: '뜻을 세워 이름을 널리 떨친다는 뜻이에요' })
  expect(WISH_TEXT.business).toMatchObject({ label: '사업·개업', hanjaMeaning: '하는 일이 크게 번창한다는 뜻이에요(개업 화환에 흔히 쓰는 말)' })
  expect(WISH_TEXT.family).toMatchObject({ label: '가족 평안', hanjaMeaning: '집안이 화목하면 모든 일이 잘 된다는 뜻이에요' })
  expect(WISH_TEXT.samjae).toMatchObject({ label: '삼재 막이', hanjaMeaning: '세 가지 재난이 사라진다는 뜻이에요' })
  expect(WISH_TEXT.wish).toMatchObject({ label: '소원성취', hanjaMeaning: '바라는 일이 이루어진다는 뜻이에요' })
})

test('새 소원의 귀여운 문구는 7자 이하의 응원·바람이고, 모든 sub는 해요체 한 줄', () => {
  for (const w of ['allgood', 'career', 'business', 'family', 'samjae', 'wish'] as const) expect([...WISH_TEXT[w].cutePhrase].length, w).toBeLessThanOrEqual(7)
  for (const w of WISHES) {
    expect(WISH_TEXT[w].sub, w).toMatch(/(요)$/)
    expect(WISH_TEXT[w].sub, w).not.toContain('\n')
  }
})

test('모든 문구가 비어 있지 않고 hanjaMeaning이 있다', () => {
  for (const w of WISHES) for (const v of Object.values(WISH_TEXT[w])) expect(v.length).toBeGreaterThan(0)
  for (const e of EL_KEYS) for (const v of Object.values(EL_TEXT[e])) expect(v.length).toBeGreaterThan(0)
})

test('화면 문구에 간지·십신 용어가 없다', () => {
  for (const s of strings()) expect(s, s).not.toMatch(/십신|천간|지지|일간|비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인/)
})

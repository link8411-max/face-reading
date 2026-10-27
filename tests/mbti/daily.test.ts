import { kstDate, mbtiDaily } from '@/lib/mbti/daily'
import { MBTI_DAILY } from '@/content/mbtiDaily'
import { MBTI_TYPES, compatSummary, type MbtiType } from '@/lib/mbti/compat'

const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10)
const DAYS = Array.from({ length: 365 }, (_, i) => addDays('2026-11-01', i))

test('한국 시간 날짜: 자정(KST) 경계에서 바뀐다', () => {
  expect(kstDate(new Date('2026-10-27T14:59:00Z'))).toBe('2026-10-27')
  expect(kstDate(new Date('2026-10-27T15:00:00Z'))).toBe('2026-10-28')
})

test('같은 날 같은 유형이면 언제 불러도 같은 결과', () => {
  expect(mbtiDaily('INFP', '2026-10-27')).toEqual(mbtiDaily('INFP', '2026-10-27'))
  expect(mbtiDaily('INFP', '2026-10-27').headline).not.toBe(mbtiDaily('INFP', '2026-10-28').headline)
})

test('한 유형의 한마디는 14일 안에 다시 나오지 않는다 (1년)', () => {
  for (const t of MBTI_TYPES) {
    const seen = new Map<string, number>()
    DAYS.forEach((d, i) => {
      const h = mbtiDaily(t, d).headline
      if (seen.has(h)) expect(i - seen.get(h)!, `${t} ${d}`).toBeGreaterThanOrEqual(14)
      seen.set(h, i)
    })
  }
})

test('같은 날 서로 다른 두 유형의 일·연애·관계 세 줄이 모두 같은 경우는 없다', () => {
  for (const d of DAYS) {
    const keys = MBTI_TYPES.map((t) => { const r = mbtiDaily(t, d); return `${r.work}|${r.love}|${r.relation}` })
    expect(new Set(keys).size, d).toBe(16)
  }
})

test('오늘 잘 맞는 유형은 자기 자신이 아니고 종합 궁합 상위 3 안', () => {
  const top3 = (a: MbtiType) => MBTI_TYPES.filter((b) => b !== a).sort((x, y) => compatSummary(a, y).total - compatSummary(a, x).total || x.localeCompare(y)).slice(0, 3)
  for (const t of MBTI_TYPES) for (const d of DAYS.slice(0, 30)) {
    const m = mbtiDaily(t, d).match
    expect(m).not.toBe(t)
    expect(top3(t)).toContain(m)
  }
})

test('문장 풀 최소 개수: 유형별 한마디 14개, 축 방향마다 12개, 중복 없음', () => {
  for (const t of MBTI_TYPES) {
    expect(MBTI_DAILY.headlines[t].length, t).toBeGreaterThanOrEqual(14)
    expect(new Set(MBTI_DAILY.headlines[t]).size, t).toBe(MBTI_DAILY.headlines[t].length)
  }
  for (const k of ['work', 'love', 'relation'] as const) for (const l of ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const) {
    const pool = MBTI_DAILY.axis[k][l]
    expect(pool.length, `${k} ${l}`).toBeGreaterThanOrEqual(12)
    expect(new Set(pool).size, `${k} ${l}`).toBe(pool.length)
  }
  for (const list of Object.values(MBTI_DAILY.lucky)) expect(list.length).toBeGreaterThanOrEqual(7)
})

test('모든 문장: 부정어·겁주는 말·이모지·느낌표 없음', () => {
  const all = [
    ...Object.values(MBTI_DAILY.headlines).flat(),
    ...Object.values(MBTI_DAILY.axis).flatMap((a) => Object.values(a).flat()),
    ...Object.values(MBTI_DAILY.lucky).flat(),
  ]
  for (const s of all) {
    expect(s, s).not.toMatch(/최악|안 맞|큰일|조심하지 않으면|불행|망하|재앙|사고가/)
    expect(s, s).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(s, s).not.toContain('!')
  }
})

// 최종 리뷰: 어색한 문장 고침
test('어색한 문장이 다시 들어오지 않는다', () => {
  const all = [...Object.values(MBTI_DAILY.headlines).flat(), ...Object.values(MBTI_DAILY.axis).flatMap((a) => Object.values(a).flat())].join('\n')
  expect(all).not.toMatch(/(?<!돈을 )쓰기 전에/) // 쓰기(글? 돈?)가 모호하지 않게
  for (const bad of ['에너지를 잠깐 쉬어 주면', '부탁을 하나쯤 내려놓으면', '함께 해결해 주세요', '나중에 봐도 옳아요', '눈이 마주친 사람과 인연']) expect(all).not.toContain(bad)
})

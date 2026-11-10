import cardsFile from '@/content/exam/meme-cards.json'
import roundsFile from '@/content/exam/meme-rounds.json'
import { areaOf, badge, makeRound, pickRound, replayUsed, roundNumberFor } from '@/lib/exam/rounds'
import type { Card, Question, Round } from '@/lib/exam/types'

const cards = cardsFile.cards as unknown as Card[]
const frozen = roundsFile.rounds as unknown as Round[]

function build(count: number): Round[] {
  const used = new Map()
  const out: Round[] = []
  for (let n = 1; n <= count; n++) {
    const r = makeRound(n, cards, used)
    if (!r) break
    out.push(r)
  }
  return out
}
const sample = build(12)
const byTerm = new Map(cards.map((c) => [c.term, c]))
const giveaway = (term: string, text: string) =>
  term.split(/\s+/).some((tok) => {
    const t = tok.replace(/[^가-힣A-Za-z]/g, '')
    return t.length >= 2 && text.includes(t)
  })
const era = (c: Card) => (c.era === 'retro' ? 'retro' : 'now')

test('같은 회차 번호는 언제나 같은 문제', () => {
  expect(build(6)).toEqual(build(6))
  expect(sample.length).toBeGreaterThanOrEqual(10)
})

test('회차는 5문제: 요즘 말 2 · 상황 밈 2 · 레트로 1', () => {
  for (const r of sample.slice(0, 10)) {
    expect(r.questions).toHaveLength(5)
    const count = { '요즘 말': 0, '상황 밈': 0, 레트로: 0 }
    for (const q of r.questions) count[areaOf(q)]++
    expect(count, `${r.round}회차`).toEqual({ '요즘 말': 2, '상황 밈': 2, 레트로: 1 })
  }
})

test('한 회차에 같은 말이 두 번 나오지 않는다', () => {
  for (const r of sample) expect(new Set(r.questions.map((q) => q.term)).size).toBe(5)
})

test('O/X는 회차에 하나 이하, 대화는 하나 이하, 다른 유형은 둘 이하', () => {
  for (const r of sample) {
    const count: Record<string, number> = {}
    for (const q of r.questions) count[q.type] = (count[q.type] ?? 0) + 1
    for (const [t, n] of Object.entries(count)) expect(n, `${r.round}회차 ${t}`).toBeLessThanOrEqual(t === 'ox' || t === 'skit' ? 1 : 2)
  }
})

test('정답 보기에 문제의 말이 들어가지 않는다(meaning·name)', () => {
  for (const q of sample.flatMap((r) => r.questions)) {
    if (q.type === 'meaning') expect(giveaway(q.term, q.options[q.answer]), q.term).toBe(false)
    if (q.type === 'name') expect(giveaway(q.term, q.show ?? ''), q.term).toBe(false)
  }
})

test('보기는 4개(O/X는 2개)이고 answer가 범위 안', () => {
  for (const q of sample.flatMap((r) => r.questions)) {
    expect(q.options, q.term).toHaveLength(q.type === 'ox' ? 2 : 4)
    expect(q.answer).toBeGreaterThanOrEqual(0)
    expect(q.answer).toBeLessThan(q.options.length)
    expect(new Set(q.options).size).toBe(q.options.length)
    if (q.type === 'skit') {
      expect(q.skit).toBeTruthy()
      expect(q.options[q.answer]).toBe(q.skit!.options[q.skit!.answer])
    } else expect(q.ask, q.term).toBeTruthy()
  }
})

test('오답은 같은 갈래·같은 시대 카드에서 온다', () => {
  const field = { meaning: 'gloss', name: 'term', unpack: 'expansion', pack: 'term' } as const
  for (const q of sample.flatMap((r) => r.questions) as Question[]) {
    if (!(q.type in field)) continue
    const f = field[q.type as keyof typeof field]
    const me = byTerm.get(q.term)!
    q.options.forEach((o, i) => {
      if (i === q.answer) return
      const from = cards.find((c) => c[f] === o)
      expect(from, `${q.term}: ${o}`).toBeTruthy()
      expect(from!.kind).toBe(me.kind)
      expect(era(from!)).toBe(era(me))
    })
  }
})

test('해설은 카드 문장 그대로', () => {
  for (const q of sample.flatMap((r) => r.questions)) {
    const c = byTerm.get(q.term)!
    expect(q.explain).toEqual({ meaning: c.meaning, usage: c.usage, origin: c.origin })
  }
})

test('badge', () => {
  expect(badge('1990s')).toBe('90년대 레트로')
  expect(badge('2000s')).toBe('2000년대 레트로')
  expect(badge('2010s')).toBe('2010년대 레트로')
  expect(badge('2020s')).toBe('2020년대 초')
  expect(badge('2026')).toBe('2026년')
})

test('roundNumberFor', () => {
  expect(roundNumberFor('2026-11-11')).toBe(1)
  expect(roundNumberFor('2026-11-13')).toBe(3)
  expect(roundNumberFor('2026-11-01')).toBe(1)
  expect(roundNumberFor('2027-01-01')).toBe(52)
})

test('pickRound는 범위를 넘으면 마지막 회차, 1보다 작으면 첫 회차', () => {
  expect(pickRound(frozen, 9999).round).toBe(frozen.at(-1)!.round)
  expect(pickRound(frozen, 0).round).toBe(1)
  expect(pickRound(frozen, -5).round).toBe(1)
  expect(pickRound(frozen, 3).round).toBe(3)
})

test('얼린 회차 파일은 1번부터 빠짐없이 이어진다', () => {
  expect(frozen.length).toBeGreaterThanOrEqual(14)
  frozen.forEach((r, i) => {
    expect(r.round).toBe(i + 1)
    expect(r.questions).toHaveLength(5)
  })
})

test('replayUsed 뒤에 만든 다음 회차는 처음부터 다시 만든 것과 같다', () => {
  const head = build(5)
  const used = replayUsed(head)
  const next = makeRound(6, cards, used)
  expect(next).toEqual(build(6)[5])
})

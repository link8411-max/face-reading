// 말 카드에서 회차를 기계적으로 만든다. 글을 새로 쓰지 않는다(scripts/exam/make-rounds.mjs를 옮긴 것, 규칙은 그대로).
// 같은 회차 번호는 언제 돌려도 같은 문제가 나온다(회차 번호가 씨앗).
import type { Card, Kind, QType, Question, Round, When } from './types'

export type { QType, Question, Round }

/** 1회차 날짜(KST). 출시 날에 맞춰 한 번만 고친다. */
export const EXAM_EPOCH = '2026-11-11'

type Used = Map<string, { last: number; types: QType[] }>

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const shuffle = <T,>(arr: T[], r: () => number): T[] =>
  arr.map((v) => [r(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1])

const eun = (w: string) => {
  const ch = w.replace(/[^가-힣A-Za-z0-9]/g, '').slice(-1)
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 ? '은' : '는'
  return '은(는)'
}
/** 정답 보기에 문제의 말이 그대로 들어 있으면 거저 주는 문제다. */
const giveaway = (term: string, text: string) =>
  term.split(/\s+/).some((tok) => {
    const t = tok.replace(/[^가-힣A-Za-z]/g, '')
    return t.length >= 2 && text.includes(t)
  })

/** 문제 카드에 붙는 뱃지: 그 말이 유행한 때. '신상' 같은 말은 붙이지 않는다(해가 바뀌면 틀린 말이 된다). */
export function badge(when: When): string {
  const fixed: Record<string, string> = { '1990s': '90년대 레트로', '2000s': '2000년대 레트로', '2010s': '2010년대 레트로', '2020s': '2020년대 초' }
  return fixed[when] ?? `${when}년`
}

export type Area = '요즘 말' | '상황 밈' | '레트로'
/** 성적표 영역 칸. 1990s~2010s는 레트로, 사연·놀이 갈래는 상황 밈, 나머지는 요즘 말. */
export function areaOf(q: Pick<Question, 'kind' | 'when'>): Area {
  if (['1990s', '2000s', '2010s'].includes(q.when)) return '레트로'
  return q.kind === 'story' || q.kind === 'play' ? '상황 밈' : '요즘 말'
}

const TYPES_BY_KIND: Record<Kind, QType[]> = {
  abbr: ['unpack', 'pack', 'meaning', 'ox'],
  word: ['meaning', 'name', 'ox'],
  person: ['name', 'meaning', 'ox'],
  story: ['meaning', 'name', 'ox'],
  play: ['meaning', 'name', 'ox'],
  code: ['meaning', 'name'],
}
type AskFn = (c: Card) => string
const ASK: { meaning: Partial<Record<Kind, AskFn>> & { _: AskFn }; name: Partial<Record<Kind, AskFn>> & { _: AskFn } } = {
  meaning: {
    code: (c) => `삐삐에 숫자 '${c.term}'. 무슨 뜻일까요?`,
    story: (c) => `'${c.term}'${eun(c.term)} 어떤 말일까요?`,
    play: (c) => `'${c.term}'${eun(c.term)} 무엇을 하는 걸까요?`,
    _: (c) => `'${c.term}'${eun(c.term)} 어떤 말일까요?`,
  },
  name: { code: () => '삐삐로 이 말을 보내려면 어떤 숫자를 찍을까요?', person: () => '이런 사람을 뭐라고 할까요?', _: () => '이런 말을 뭐라고 할까요?' },
}

export function makeQuestion(card: Card, type: QType, pool: Card[], r: () => number): Question | null {
  const same = shuffle(pool.filter((c) => c.kind === card.kind && c.era === card.era && c.term !== card.term), r) // 레트로는 레트로끼리 섞는다
  const base = { term: card.term, kind: card.kind, when: card.when, badge: badge(card.when), level: card.level, type, explain: { meaning: card.meaning, usage: card.usage, origin: card.origin } }
  const pick = (field: 'gloss' | 'term' | 'expansion') => {
    const wrong = same.filter((c) => c[field]).slice(0, 3).map((c) => c[field] as string)
    if (wrong.length < 3) return null
    const options = shuffle([card[field] as string, ...wrong], r)
    return { options, answer: options.indexOf(card[field] as string) }
  }
  if (type === 'skit') {
    if (!card.skit) return null
    const options = shuffle(card.skit.options, r)
    return { ...base, ask: '', skit: card.skit, options, answer: options.indexOf(card.skit.options[card.skit.answer]) }
  }
  if ((type === 'meaning' || type === 'name') && giveaway(card.term, card.gloss)) return null
  if (type === 'pack' && card.level > 1) return null // 원형을 보여 주면 너무 쉬워서 쉬움에만
  if (type === 'meaning') { const o = pick('gloss'); return o && { ...base, ask: (ASK.meaning[card.kind] ?? ASK.meaning._)(card), ...o } }
  if (type === 'name') { const o = pick('term'); return o && { ...base, ask: (ASK.name[card.kind] ?? ASK.name._)(card), show: card.gloss, ...o } }
  if (type === 'unpack') { const o = card.expansion ? pick('expansion') : null; return o && { ...base, ask: `'${card.term}'${eun(card.term)} 무엇을 줄인 말일까요?`, ...o } }
  if (type === 'pack') { const o = card.expansion ? pick('term') : null; return o && { ...base, ask: '다음을 줄이면?', show: card.expansion, ...o } }
  if (type === 'ox') {
    const truth = r() < 0.5 || !same.length
    const gloss = truth ? card.gloss : same[0].gloss
    return { ...base, ask: '맞으면 O, 틀리면 X', show: `'${card.term}' — ${gloss}`, options: ['O', 'X'], answer: truth ? 0 : 1 }
  }
  return null
}

/** 회차 하나: 쉬움 2 · 보통 2 · 어려움 1, 요즘 말 2 + 상황 밈 2 + 레트로 1, 유형은 한 회차에 같은 것이 두 번까지. */
export function makeRound(n: number, cards: Card[], used: Used, gap = 5): Round | null {
  const r = rng(n * 7919)
  // 처음 쓰는 카드를 먼저, 모자라면 gap회차 넘게 쉰 카드를 다른 유형으로 다시 쓴다.
  const seen = (c: Card) => used.get(c.term)
  const free = [
    ...shuffle(cards.filter((c) => !seen(c)), r),
    ...shuffle(cards.filter((c) => seen(c) && n - seen(c)!.last >= gap), r),
  ]
  // 자리 다섯: 요즘 말(쉬움) · 상황 밈(쉬움) · 레트로 · 상황 밈(보통) · 요즘 말(어려움)
  const group = (c: Card) => (c.era === 'retro' ? 'retro' : c.kind === 'story' || c.kind === 'play' ? 'meme' : 'word')
  const want: [number, string][] = [[1, 'word'], [1, 'meme'], [2, 'retro'], [2, 'meme'], [3, 'word']]
  const chosen: Card[] = []
  const count: Record<string, number> = {}
  let skits = 0
  const qs: Question[] = []
  // 자리마다 맞는 카드를 차례로 대 보고, 문제가 만들어지는 첫 카드를 쓴다(난이도가 맞는 카드 먼저).
  want.forEach(([level, grp], i) => {
    const cands = free.filter((x) => !chosen.includes(x) && group(x) === grp)
    for (const card of [...cands.filter((x) => x.level === level), ...cands.filter((x) => x.level !== level)]) {
      const before = seen(card)?.types ?? []
      let types = shuffle(TYPES_BY_KIND[card.kind].filter((t) => !before.includes(t)), r)
      if (card.skit && skits === 0 && !before.includes('skit') && (n + i) % 3 === 0) types = ['skit', ...types]
      for (const t of types) {
        if ((count[t] ?? 0) >= (t === 'ox' ? 1 : 2)) continue // O/X는 찍어도 반은 맞아서 한 회차에 하나만
        const q = makeQuestion(card, t, cards, r)
        if (!q) continue
        count[t] = (count[t] ?? 0) + 1
        if (t === 'skit') skits++
        chosen.push(card)
        qs.push(q)
        return
      }
    }
  })
  if (qs.length !== 5) return null
  qs.forEach((q) => {
    const u = used.get(q.term) ?? { last: 0, types: [] }
    used.set(q.term, { last: n, types: [...u.types, q.type] })
  })
  return { round: n, questions: qs }
}

/** 얼려 둔 회차에서 '이미 낸 말' 상태를 되살린다(뒤에 덧붙일 때 씀). */
export function replayUsed(rounds: Round[]): Used {
  const used: Used = new Map()
  for (const rd of rounds) {
    for (const q of rd.questions) {
      const u = used.get(q.term) ?? { last: 0, types: [] }
      used.set(q.term, { last: rd.round, types: [...u.types, q.type] })
    }
  }
  return used
}

/** KST 날짜(YYYY-MM-DD) → 회차 번호. EXAM_EPOCH이 1회차, 그 전은 1. */
export function roundNumberFor(kstYmd: string): number {
  const ms = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  const days = Math.round((ms(kstYmd) - ms(EXAM_EPOCH)) / 86_400_000)
  return Math.max(1, days + 1)
}

/** n이 범위를 넘으면 마지막 회차, 1보다 작으면 첫 회차. */
export function pickRound(rounds: Round[], n: number): Round {
  const i = Math.min(Math.max(Math.trunc(n) || 1, 1), rounds.length)
  return rounds[i - 1]
}

/** 회차의 날짜 표기(예: 2026년 11월 18일). 회차 번호에서 계산하므로 지금 시각과 상관없다. */
export function roundDateLabel(n: number): string {
  const [y, m, d] = EXAM_EPOCH.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + Math.max(1, n) - 1))
  return `${t.getUTCFullYear()}년 ${t.getUTCMonth() + 1}월 ${t.getUTCDate()}일`
}

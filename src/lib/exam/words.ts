// 낱말 페이지(말마다 하나)용 순수 함수. 정답 유출을 막으려고 '오늘 회차와 앞으로 나올 회차의 말'은 숨긴다.
import cardsFile from '@/content/exam/meme-cards.json'
import { EXAM_EPOCH, makeQuestion, rng, roundNumberFor } from './rounds'
import type { Card, Kind, Question, Round, When } from './types'

const CARDS = cardsFile.cards as unknown as Card[]

/** 공백은 `-`, 따옴표·물음표 같은 기호는 없애고 한글은 그대로 둔다. */
export function wordSlug(term: string): string {
  return term.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export function cardBySlug(slug: string): Card | null {
  let s = slug
  try { s = decodeURIComponent(slug) } catch { /* 이미 풀린 값 */ }
  return CARDS.find((c) => wordSlug(c.term) === s) ?? null
}

/** 얼린 회차에서 그 말이 처음 나오는 회차. 어디에도 없으면 null. */
export function firstRoundOf(term: string, rounds: Round[]): number | null {
  for (const r of rounds) if (r.questions.some((q) => q.term === term)) return r.round
  return null
}

/** 처음 나오는 회차가 오늘 회차보다 앞일 때만 공개. 회차에 없는 말은 앞으로 나올 수 있으므로 숨긴다. */
export function isReleased(term: string, rounds: Round[], todayRound: number): boolean {
  const first = firstRoundOf(term, rounds)
  return first !== null && first < todayRound
}

/** 오늘 회차 번호(홈 화면과 같은 규칙: 얼린 회차 수를 넘으면 마지막 회차를 다시 연다). */
export function todayRoundNo(kstYmd: string, rounds: Round[]): number {
  return Math.min(roundNumberFor(kstYmd), rounds.length)
}

export function releasedCards(cards: Card[], rounds: Round[], todayRound: number): Card[] {
  return cards.filter((c) => isReleased(c.term, rounds, todayRound))
}

/** 같은 때 유행한 말 최대 6 + 같은 갈래의 말 최대 6(겹치면 뺀다, 자기 자신 제외). */
export function relatedWords(card: Card, released: Card[]): { sameWhen: Card[]; sameKind: Card[] } {
  const others = released.filter((c) => c.term !== card.term)
  const sameWhen = others.filter((c) => c.when === card.when).slice(0, 6)
  const taken = new Set(sameWhen.map((c) => c.term))
  const sameKind = others.filter((c) => c.kind === card.kind && !taken.has(c.term)).slice(0, 6)
  return { sameWhen, sameKind }
}

export const KIND_LABEL: Record<Kind, string> = {
  abbr: '줄임말',
  word: '낱말',
  person: '사람을 가리키는 말',
  story: '사연이나 문장 밈',
  play: '놀이나 영상 밈',
  code: '삐삐 숫자',
}

const WHEN_ORDER = ['1990s', '2000s', '2010s', '2020s']
/** 연대 순서(옛날 → 최근) 비교 값 */
export const whenRank = (w: When): number => {
  const i = WHEN_ORDER.indexOf(w)
  return i >= 0 ? i : 10 + Number(w)
}

export { CARDS as ALL_CARDS }

const seedOf = (s: string) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7)

/** 이 말로 한 문제. 오답은 공개된 말에서만 가져온다(숨긴 말이 보기로 새면 안 된다). */
export function quizFor(card: Card, released: Card[], slug: string): Question | null {
  const pool = [card, ...released.filter((c) => c.term !== card.term)]
  for (const type of ['meaning', 'name', 'ox'] as const) {
    const q = makeQuestion(card, type, pool, rng(seedOf(slug)))
    if (q) return q
  }
  return null
}

export const EMPTY_COPY = '아직 열린 말이 없어요. 오늘 문제에 나온 말은 내일 열려요.'

/** 공개된 낱말 페이지 주소와 공개된 날(처음 나온 회차의 다음 날, KST 기준 날짜) */
export function releasedWordRoutes(todayYmd: string, rounds: Round[]): [string, string][] {
  return releasedCards(CARDS, rounds, todayRoundNo(todayYmd, rounds)).map((c) => {
    const d = new Date(`${EXAM_EPOCH}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + (firstRoundOf(c.term, rounds) ?? 1))
    return [`/exam/meme/words/${encodeURI(wordSlug(c.term))}`, d.toISOString().slice(0, 10)]
  })
}

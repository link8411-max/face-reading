import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import cardsFile from '@/content/exam/meme-cards.json'
import roundsFile from '@/content/exam/meme-rounds.json'
import WordBody from '@/components/exam/WordBody'
import WordsIndexPage from '@/app/exam/meme/words/page'
import WordPage, { generateMetadata, generateStaticParams } from '@/app/exam/meme/words/[slug]/page'
import sitemap from '@/app/sitemap'
import { EXAM_EPOCH } from '@/lib/exam/rounds'
import type { Card, Round } from '@/lib/exam/types'
import { cardBySlug, EMPTY_COPY, firstRoundOf, isReleased, quizFor, relatedWords, releasedCards, todayRoundNo, wordSlug } from '@/lib/exam/words'

const cards = cardsFile.cards as unknown as Card[]
const rounds = roundsFile.rounds as unknown as Round[]
const EMOJI = /[\u{1F300}-\u{1FAFF}☀-➿]/u

// EXAM_EPOCH 기준: 11/11이 1회차이므로 11/20 낮은 10회차
const at = (ymd: string) => vi.setSystemTime(new Date(`${ymd}T03:00:00Z`))
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }) })
afterEach(() => vi.useRealTimers())

test('출시 날짜가 테스트 가정과 같다', () => expect(EXAM_EPOCH).toBe('2026-11-11'))

test('slug는 카드 수만큼 유일하고 왕복한다', () => {
  const slugs = cards.map((c) => wordSlug(c.term))
  expect(slugs).toHaveLength(cards.length)
  expect(new Set(slugs).size).toBe(cards.length)
  for (const c of cards) {
    const s = wordSlug(c.term)
    expect(s, c.term).toBeTruthy()
    expect(s).not.toMatch(/[\s?'"!.,]/)
    expect(cardBySlug(s)?.term).toBe(c.term)
    expect(cardBySlug(encodeURIComponent(s))?.term).toBe(c.term) // 주소에서 인코딩돼 들어와도
  }
  expect(cardBySlug('없는-말')).toBeNull()
  expect(generateStaticParams()).toHaveLength(cards.length)
  expect(wordSlug('AI 한 단어 챌린지')).toBe('AI-한-단어-챌린지')
})

test('isReleased 경계: 오늘 회차의 말은 숨기고 어제 회차의 말은 열고 회차에 없는 말은 숨긴다', () => {
  const todayTerm = rounds[4].questions[0].term // 5회차 말
  const first = firstRoundOf(todayTerm, rounds)!
  expect(isReleased(todayTerm, rounds, first)).toBe(false)
  expect(isReleased(todayTerm, rounds, first + 1)).toBe(true)
  expect(isReleased(todayTerm, rounds, first - 1)).toBe(false)
  const unused = cards.find((c) => firstRoundOf(c.term, rounds) === null)
  if (unused) expect(isReleased(unused.term, rounds, 999)).toBe(false)
  expect(isReleased('없는 말', rounds, 999)).toBe(false)
})

test('오늘 회차는 얼린 회차 수를 넘지 않는다(마지막 회차의 말은 계속 숨김)', () => {
  expect(todayRoundNo('2030-01-01', rounds)).toBe(rounds.length)
  const lastNo = rounds.length
  const last = rounds.at(-1)!.questions.map((q) => q.term).find((t) => firstRoundOf(t, rounds) === lastNo)!
  expect(isReleased(last, rounds, todayRoundNo('2030-01-01', rounds))).toBe(false)
})

test('relatedWords: 같은 때 6 + 같은 갈래 6, 겹침·자기 자신 제외', () => {
  for (const c of cards) {
    const { sameWhen, sameKind } = relatedWords(c, cards)
    expect(sameWhen.length).toBeLessThanOrEqual(6)
    expect(sameKind.length).toBeLessThanOrEqual(6)
    const all = [...sameWhen, ...sameKind].map((x) => x.term)
    expect(new Set(all).size).toBe(all.length)
    expect(all).not.toContain(c.term)
    sameWhen.forEach((x) => expect(x.when).toBe(c.when))
    sameKind.forEach((x) => expect(x.kind).toBe(c.kind))
  }
})

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })
const html = (el: unknown) => renderToStaticMarkup(el as React.ReactElement)

test('숨긴 말 주소는 notFound, 공개된 말은 본문이 나온다', async () => {
  at('2026-11-20')
  const today = todayRoundNo('2026-11-20', rounds)
  const open = releasedCards(cards, rounds, today)
  const hidden = cards.find((c) => !open.includes(c))!
  await expect(WordPage(params(wordSlug(hidden.term)))).rejects.toThrow()
  await expect(WordPage(params('없는-말'))).rejects.toThrow()
  const shown = open[0]
  const out = html(await WordPage(params(wordSlug(shown.term))))
  expect(out).toContain(`${shown.term} 뜻`)
  for (const t of ['이런 말이에요', '이럴 때 써요', '어디서 나왔나', '이 말로 한 문제', '오늘의 5문제 풀기']) expect(out).toContain(t)
  expect(out).toContain('href="/exam/meme"')
  expect(out).toContain('DefinedTerm')
  expect(out).toContain('BreadcrumbList')
  expect(out).not.toMatch(EMOJI)
})

test('이 말로 한 문제의 오답에 숨긴 말이 없다', () => {
  const today = todayRoundNo('2026-11-20', rounds)
  const open = releasedCards(cards, rounds, today)
  const hiddenCards = cards.filter((c) => !open.includes(c))
  for (const c of open) {
    const q = quizFor(c, open, wordSlug(c.term))
    if (!q) continue
    expect(q.term).toBe(c.term)
    const wrong = q.options.filter((_, i) => i !== q.answer)
    for (const h of hiddenCards) {
      expect(wrong, c.term).not.toContain(h.term)
      expect(wrong, c.term).not.toContain(h.gloss)
      if (h.expansion) expect(wrong).not.toContain(h.expansion)
    }
    expect(quizFor(c, open, wordSlug(c.term))).toEqual(q) // 같은 말은 늘 같은 문제
  }
})

test('낱말 페이지 본문은 공백 제외 300자 이상(모든 카드, 관련 말 포함)', () => {
  // 본문이 300자에 못 미치는 카드(삐삐 숫자 5장: 뜻·쓰임·유래 문장이 짧다). 카드 문장을 지어내 늘리지 않고 보고만 한다
  const KNOWN_SHORT = ['1004', '1010235', '486', '7942', '8282']
  const short: string[] = []
  for (const c of cards) {
    const { sameWhen, sameKind } = relatedWords(c, cards)
    const text = html(<WordBody card={c} sameWhen={sameWhen} sameKind={sameKind} quiz={quizFor(c, cards, wordSlug(c.term))} />)
      .replace(/<[^>]+>/g, '')
      .replace(/\s/g, '')
    if (text.length < 300) short.push(c.term)
    expect(text).not.toMatch(EMOJI)
  }
  expect(short.sort()).toEqual(KNOWN_SHORT)
})

test('제목은 48자 이하(넘으면 뒤의 | 밈 능력고사를 뺀다)', async () => {
  for (const c of cards) {
    const m = await generateMetadata(params(wordSlug(c.term)))
    const base = `${c.term} 뜻 – ${c.gloss}`
    const full = `${base} | 밈 능력고사`
    // 넘으면 gloss를 줄이지 않고 뒤의 브랜드를 뺀다. 그래도 넘는 카드는 부라는 게… 한 장뿐(49자)
    expect(String(m.title)).toBe(full.length <= 48 ? full : base)
    if (c.term !== '부라는 게 숨긴다고 숨겨지는 것도 아니고') expect(String(m.title).length, c.term).toBeLessThanOrEqual(48)
    expect(m.alternates?.canonical).toBe(`https://unse-ai.com/exam/meme/words/${wordSlug(c.term)}`)
  }
})

test('모음 페이지: 공개된 말만, 비어 있으면 안내 문구', () => {
  at('2026-11-11')
  const empty = html(<WordsIndexPage />)
  expect(empty).toContain(EMPTY_COPY)
  expect(empty).toContain('오늘의 5문제 풀기')
  at('2026-11-20')
  const open = releasedCards(cards, rounds, todayRoundNo('2026-11-20', rounds))
  const out = html(<WordsIndexPage />)
  expect(out).not.toContain(EMPTY_COPY)
  for (const c of cards) {
    const link = `/exam/meme/words/${wordSlug(c.term)}"`
    expect(out.includes(link), c.term).toBe(open.includes(c))
  }
  expect(out).not.toMatch(EMOJI)
})

test('사이트맵: 모음 페이지는 늘 있고 낱말 페이지는 공개된 말만', () => {
  at('2026-11-11')
  const urls0 = sitemap().map((e) => e.url)
  expect(urls0).toContain('https://unse-ai.com/exam/meme/words')
  expect(urls0.filter((u) => u.includes('/exam/meme/words/'))).toHaveLength(0)
  at('2026-11-20')
  const open = releasedCards(cards, rounds, todayRoundNo('2026-11-20', rounds))
  const urls = sitemap().map((e) => decodeURI(e.url))
  const words = urls.filter((u) => u.includes('/exam/meme/words/'))
  expect(words).toHaveLength(open.length)
  const hidden = cards.filter((c) => !open.includes(c))
  for (const h of hidden) expect(urls).not.toContain(`https://unse-ai.com/exam/meme/words/${wordSlug(h.term)}`)
  expect(urls.some((u) => u.includes('/exam/meme/r/'))).toBe(false)
})

import { readFileSync } from 'node:fs'
import cards from '@/content/exam/meme-cards.json'
import type { Card } from '@/lib/exam/types'

const list = cards.cards as unknown as Card[]
const banned = (JSON.parse(readFileSync('scripts/exam/subjects/meme.json', 'utf8')).banned as { term: string }[]).map((b) => b.term)

const giveaway = (term: string, text: string) =>
  term.split(/\s+/).some((tok) => {
    const t = tok.replace(/[^가-힣A-Za-z]/g, '')
    return t.length >= 2 && text.includes(t)
  })

test('카드 필수 칸', () => {
  for (const c of list) {
    expect(c.term && c.gloss && c.meaning && c.usage && c.origin, c.term).toBeTruthy()
    expect(['abbr', 'word', 'person', 'story', 'play', 'code']).toContain(c.kind)
    expect(c.when).toMatch(/^(1990s|2000s|2010s|2020s|20\d\d)$/)
    expect(c.era).toBe(['1990s', '2000s', '2010s'].includes(c.when) ? 'retro' : 'now')
    expect([1, 2, 3]).toContain(c.level)
    if (c.kind === 'abbr') expect(c.expansion, c.term).toBeTruthy()
  }
})

test('말이 겹치지 않는다', () => expect(new Set(list.map((c) => c.term)).size).toBe(list.length))

test('한 줄 뜻은 40자 이하이고 그 말을 그대로 담지 않는다', () => {
  for (const c of list) {
    expect(c.gloss.length, `${c.term}: ${c.gloss}`).toBeLessThanOrEqual(40)
    expect(giveaway(c.term, c.gloss), `${c.term}: ${c.gloss}`).toBe(false)
  }
})

test('금지어가 없다', () => {
  expect(banned.length).toBeGreaterThan(0)
  for (const c of list) {
    const text = [c.term, c.gloss, c.meaning, c.usage, c.origin, JSON.stringify(c.skit ?? '')].join('\n')
    for (const b of banned) expect(text.includes(b), `${c.term} 에 금지어 ${b}`).toBe(false)
  }
})

test('이모지가 없다', () => {
  const emoji = /[\u{1F300}-\u{1FAFF}☀-➿]/u
  expect(emoji.test(JSON.stringify(list))).toBe(false)
})

test('대화 문제 구조', () => {
  const skits = list.filter((c) => c.skit)
  expect(skits.length).toBeGreaterThan(0)
  for (const c of skits) {
    const s = c.skit!
    expect(['blank', 'reply', 'card']).toContain(s.form)
    expect(s.options, c.term).toHaveLength(4)
    expect(s.answer).toBeGreaterThanOrEqual(0)
    expect(s.answer).toBeLessThan(4)
    for (const l of s.lines) expect(typeof l.who === 'string' && typeof l.text === 'string').toBe(true)
    if (s.form === 'card') {
      expect(s.lines.map((l) => l.who)).toEqual(['카드', '질문'])
    } else {
      expect(s.lines.some((l) => l.text.includes('____')), c.term).toBe(true)
      expect(s.right && s.wrong && s.timeout, c.term).toBeTruthy()
    }
    expect(JSON.stringify(s)).not.toMatch(/\*\*|`|알아들은 척/)
  }
})

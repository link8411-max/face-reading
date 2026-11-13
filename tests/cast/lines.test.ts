import { CAST_LINES, type LineKey } from '@/content/castLines'
import { UI as KO } from '@/content/ko/ui'
import { UI as EN } from '@/content/en/ui'
import { BANNED_PHRASES } from '@/lib/bujeok/bannedPhrases'

const KEYS = Object.keys(CAST_LINES) as LineKey[]
const ko = (k: LineKey) => (KO as Record<string, string>)[k]
const en = (k: LineKey) => (EN as Record<string, string>)[k]

test('대사 키가 ko·en 사전에 모두 있다', () => {
  for (const k of KEYS) {
    expect(ko(k), k).toBeTruthy()
    expect(en(k), k).toBeTruthy()
  }
})

test('한국어 대사는 공백 포함 44자 이하(두 줄)', () => {
  for (const k of KEYS) expect([...ko(k)].length, `${k}: ${ko(k)}`).toBeLessThanOrEqual(44)
})

test('영어 대사는 80자 이하', () => {
  for (const k of KEYS) expect(en(k).length, k).toBeLessThanOrEqual(80)
})

test('해태·무당·박수무당은 해요체, 나머지는 반말(요로 끝나지 않는다)', () => {
  for (const k of KEYS) {
    const polite = ['haetae', 'mudang', 'baksu'].includes(CAST_LINES[k])
    // 한 말풍선 안의 모든 문장 끝을 본다
    const sentences = ko(k).split(/(?<=[.?!])\s*/).filter(Boolean)
    for (const s of sentences) {
      if (polite) expect(s, `${k}: ${s}`).toMatch(/요[.?!]?$/)
      else expect(s, `${k}: ${s}`).not.toMatch(/요[.?!]?$/)
    }
  }
})

test('저승사자 대사에 죽음·데려간다·수명이 없다', () => {
  for (const k of KEYS.filter((x) => ['saja', 'sajaF', 'sajaElder'].includes(CAST_LINES[x]))) {
    for (const w of ['죽', '데려', '수명']) expect(ko(k), k).not.toContain(w)
  }
})

test('효험 단정과 이모지가 없다(한국어·영어)', () => {
  for (const k of KEYS) {
    for (const text of [ko(k), en(k)]) {
      for (const w of BANNED_PHRASES) expect(text, k).not.toContain(w)
      expect(text, k).not.toMatch(/\p{Extended_Pictographic}/u)
    }
  }
})

test('캐릭터 아홉이 모두 말할 줄이 있다', () => {
  expect(new Set(Object.values(CAST_LINES))).toEqual(new Set(['haetae', 'saja', 'gumiho', 'mudang', 'tiger', 'dokkaebi', 'sajaF', 'sajaElder', 'baksu']))
})

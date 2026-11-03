import fs from 'node:fs'
import path from 'node:path'
import { allSamgukCharacters } from '@/lib/samgukDB'
import { PEOPLE, PEOPLE_IDS, getPerson } from '@/content/samgukPeople'
import { VERDICTS } from '@/content/samgukPeople/types'
import { relationsOf, factionGroups } from '@/lib/people/relations'

const DB_IDS = new Set(allSamgukCharacters.map((c) => c.id))
const SOURCES = ['정사', '배송지 주', '연의']

// 객체 안의 모든 문자열을 모은다.
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (Array.isArray(v)) return v.flatMap(strings)
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings)
  return []
}

test('every PEOPLE id exists in allSamgukCharacters', () => {
  expect(PEOPLE_IDS.length).toBeGreaterThan(0)
  for (const id of PEOPLE_IDS) {
    expect(DB_IDS.has(id), id).toBe(true)
    expect(PEOPLE[id].id).toBe(id)
    expect(getPerson(id)).toBe(PEOPLE[id])
  }
  expect(getPerson('nobody')).toBeUndefined()
})

test('each entry passes shape rules', () => {
  const verdictKeys = VERDICTS.map((v) => v.key) as string[]
  for (const id of PEOPLE_IDS) {
    const p = PEOPLE[id]
    expect(p.summary.length, `${id} summary`).toBeGreaterThanOrEqual(60)
    expect(p.summary.length, `${id} summary`).toBeLessThanOrEqual(200)
    expect(p.tags.length, `${id} tags`).toBeGreaterThanOrEqual(3)
    expect(p.tags.length, `${id} tags`).toBeLessThanOrEqual(5)
    expect(p.life.length, `${id} life`).toBeGreaterThanOrEqual(600)
    expect(p.life.length, `${id} life`).toBeLessThanOrEqual(1200)
    expect(p.historyNote.length, `${id} historyNote`).toBeGreaterThanOrEqual(150)
    expect(p.historyNote.length, `${id} historyNote`).toBeLessThanOrEqual(400)
    expect(p.battles.length, `${id} battles`).toBeGreaterThanOrEqual(2)
    expect(p.novelVsHistory.length, `${id} novelVsHistory`).toBeGreaterThanOrEqual(2)
    expect(p.novelVsHistory.length, `${id} novelVsHistory`).toBeLessThanOrEqual(4)
    expect(p.sceneOptions.length, `${id} sceneOptions`).toBeGreaterThanOrEqual(3)
    expect(p.sceneOptions.length, `${id} sceneOptions`).toBeLessThanOrEqual(4)
    for (const s of p.sceneOptions) expect(s.key, `${id} scene key`).toMatch(/^[a-z_]+$/)
    expect(new Set(p.sceneOptions.map((s) => s.key)).size).toBe(p.sceneOptions.length)
    expect(p.verdictOptions.length, `${id} verdictOptions`).toBe(4)
    expect(new Set(p.verdictOptions).size).toBe(4)
    for (const v of p.verdictOptions) expect(verdictKeys, `${id} verdict ${v}`).toContain(v)
    expect(p.rivalId, `${id} rivalId`).not.toBe(id)
    expect(PEOPLE[p.rivalId], `${id} rival in PEOPLE`).toBeDefined()
    expect(SOURCES).toContain(p.famousQuote.source)
    for (const b of p.battles) expect(SOURCES).toContain(b.source)
    for (const s of p.sceneOptions) expect(SOURCES).toContain(s.source)
    for (const r of p.relations) {
      expect(Boolean(r.id || r.name), `${id} relation needs id or name`).toBe(true)
      if (r.id) {
        expect(DB_IDS.has(r.id), `${id} relation id ${r.id}`).toBe(true)
        expect(r.id).not.toBe(id)
      }
      expect(SOURCES).toContain(r.source)
    }
  }
})

test('no banned copy', () => {
  for (const id of PEOPLE_IDS) {
    for (const s of strings(PEOPLE[id])) {
      expect(s.includes('!'), `${id}: ${s.slice(0, 30)}`).toBe(false)
      expect(/\p{Extended_Pictographic}/u.test(s), `${id}: ${s.slice(0, 30)}`).toBe(false)
    }
  }
})

test('relationsOf is bidirectional', () => {
  const g = relationsOf('guanyu')
  expect(g.some((r) => r.otherId === 'caocao')).toBe(true)
  expect(relationsOf('caocao').some((r) => r.otherId === 'guanyu')).toBe(true)
  // 중복 제거: otherId 기준 한 번씩만
  const ids = g.filter((r) => r.otherId).map((r) => r.otherId)
  expect(new Set(ids).size).toBe(ids.length)
})

test('relationsOf marks pages and kin', () => {
  const g = relationsOf('guanyu')
  const ping = g.find((r) => r.otherId === 'guanping')!
  expect(ping.hasPage).toBe(false)
  expect(ping.type).toBe('부자')
  expect(ping.kin).toBe(true)
  expect(ping.otherName).toBe('관평')
  expect(g.find((r) => r.otherId === 'caocao')!.hasPage).toBe(true)
  // 이름만 있는 관계는 otherId null로 남는다
  const c = relationsOf('caocao')
  const nameOnly = c.find((r) => r.otherId === null)!
  expect(nameOnly).toBeDefined()
  expect(nameOnly.hasPage).toBe(false)
  expect(nameOnly.otherName.length).toBeGreaterThan(0)
  // 부자는 kin, 라이벌은 kin 아님
  const rival = [...g, ...c].find((r) => r.type === '라이벌')!
  expect(rival.kin).toBe(false)
  expect(c.find((r) => r.type === '부자')!.kin).toBe(true)
})

test('factionGroups covers PEOPLE_IDS only', () => {
  const groups = factionGroups()
  const all = groups.flatMap((g) => g.ids).sort()
  expect(all).toEqual([...PEOPLE_IDS].sort())
  const wei = groups.find((g) => g.faction === '위')!
  expect(wei.ids).toContain('caocao')
  const shu = groups.find((g) => g.faction === '촉')!
  expect(shu.ids).toContain('guanyu')
  for (const g of groups) expect(g.ids.length).toBeGreaterThan(0)
})

test('progress doc marks every published person as fact-checked', () => {
  const doc = fs.readFileSync(path.join(process.cwd(), 'docs/samguk-people-progress.md'), 'utf8')
  const rows = new Map<string, string[]>()
  for (const line of doc.split('\n')) {
    const m = line.match(/^\| ([a-z]+) \|/)
    if (!m) continue
    if (m[1] === 'id') {
      // 머리글 열 순서 확인
      expect(line.split('|').slice(1, -1).map((c) => c.trim())).toEqual(['id', '이름', '초상화', '열전', '사실 검토', '공개'])
      continue
    }
    rows.set(m[1], line.split('|').slice(1, -1).map((c) => c.trim()))
  }
  // 모든 DB 인물이 한 줄씩 있다
  expect(rows.size).toBe(allSamgukCharacters.length)
  for (const c of allSamgukCharacters) {
    const cols = rows.get(c.id)!
    expect(cols, c.id).toBeDefined()
    expect(cols.length).toBe(6) // id | 이름 | 초상화 | 열전 | 사실 검토 | 공개
    expect(cols[1]).toBe(c.name)
  }
  for (const id of PEOPLE_IDS) {
    const cols = rows.get(id)!
    expect(cols[3], `${id} 열전`).toBe('O')
    expect(cols[4], `${id} 사실 검토`).toBe('O')
  }
})

import { renderToStaticMarkup } from 'react-dom/server'
import { samgukCharacters } from '@/lib/samgukDB'
import { guardianFor } from '@/lib/samguk/guardian'
import SamgukGameCard from '@/components/samguk/SamgukGameCard'

test.each(samgukCharacters.map((c) => c.name))('%s의 지켜줄 장수: 자기 자신이 아니고 점수 80~98, 결정적', (name) => {
  const g = guardianFor(name)
  expect(g.character.name).not.toBe(name)
  expect(g.score).toBeGreaterThanOrEqual(80)
  expect(g.score).toBeLessThanOrEqual(98)
  expect(Number.isInteger(g.score)).toBe(true)
  expect(guardianFor(name)).toEqual(g)
  expect(g.line).not.toMatch(/최악|나쁜|안 맞|싫/)
  expect(g.line.length).toBeGreaterThan(10)
})

test('지켜줄 장수는 한두 명에 몰리지 않는다', () => {
  const picks = new Set(samgukCharacters.map((c) => guardianFor(c.name).character.name))
  expect(picks.size).toBeGreaterThanOrEqual(8)
})

test('같은 세력 인물이 2명 이상이면 같은 세력에서 고른다', () => {
  for (const c of samgukCharacters) {
    const same = samgukCharacters.filter((x) => x.faction === c.faction && x.name !== c.name)
    if (same.length >= 2) expect(guardianFor(c.name).character.faction, c.name).toBe(c.faction)
  }
})

test('게임 카드: 회사생활 스탯 5개, 현대 직업, 한줄평, 닮음 %, 워터마크', () => {
  const c = samgukCharacters.find((x) => x.name === '관우')!
  const html = renderToStaticMarkup(<SamgukGameCard character={c} similarity={87} />)
  for (const k of ['칼퇴력', '술자리생존', '워라밸', '재테크', '꼰대력']) expect(html).toContain(k)
  expect(html).toContain(c.modernJob)
  expect(html).toContain(c.modernComment)
  expect(html).toContain('닮음 87%')
  expect(html).toContain('UNSE-AI.COM')
  expect(html).toContain('font-pixel')
  expect(html).toContain('/images/samguk/관우.jpg')
  expect(html).toContain('SHU')
})

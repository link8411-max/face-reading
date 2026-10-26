import { buildTeam, ROLE_ORDER } from '@/lib/samguk/team'
import { samgukCharacters } from '@/lib/samgukDB'
import { teamUrl, parseTeam } from '@/lib/shareLinks'

const c = (id: string) => samgukCharacters.find((x) => x.id === id)!
const byFaction = (f: string) => samgukCharacters.filter((x) => x.faction === f)

test('역할: 한 사람 한 역할, 군주→책사→선봉장→살림꾼 순으로 채우고 남으면 든든한 장수', () => {
  const six = samgukCharacters.slice(0, 6).map((character) => ({ character }))
  const t = buildTeam(six)
  expect(t.members.map((m) => m.role).filter((r) => r !== '든든한 장수').sort()).toEqual([...ROLE_ORDER].sort())
  expect(t.members.filter((m) => m.role === '든든한 장수')).toHaveLength(2)
  // 군주는 통솔+매력이 가장 높은 사람
  const lord = t.members.find((m) => m.role === '군주')!
  const top = Math.max(...six.map(({ character: x }) => x.stats.통솔 + x.stats.매력))
  expect(lord.character.stats.통솔 + lord.character.stats.매력).toBe(top)
})

test('2명이면 군주·책사만, 같은 장수가 두 번 나와도 각자 역할', () => {
  const t = buildTeam([{ character: c('caocao') }, { character: c('caocao') }])
  expect(t.members.map((m) => m.role)).toEqual(['군주', '책사'])
})

test('동점이면 먼저 올린 사람이 역할을 맡는다', () => {
  const t = buildTeam([{ character: c('zhaoyun'), nickname: 'A' }, { character: c('zhaoyun'), nickname: 'B' }])
  expect(t.members.find((m) => m.role === '군주')!.nickname).toBe('A')
})

test('팀의 기운: 최다 세력, 기타면 군웅할거, 위·촉·오 동수면 천하삼분, 그 밖 동수는 먼저 올린 사람', () => {
  const [w, s, o, g] = ['위', '촉', '오', '기타'].map(byFaction)
  expect(buildTeam([w[0], w[1], s[0]].map((character) => ({ character }))).spirit).toBe('위나라 기운')
  expect(buildTeam([g[0], g[1], s[0]].map((character) => ({ character }))).spirit).toBe('군웅할거의 기운')
  expect(buildTeam([w[0], s[0], o[0]].map((character) => ({ character }))).spirit).toBe('천하삼분')
  expect(buildTeam([s[0], w[0]].map((character) => ({ character }))).spirit).toBe('촉나라 기운')
})

test('팀 회사생활 STATUS는 평균(정수), 한줄평은 부정어 없음', () => {
  const m = [c('caocao'), c('liubei')].map((character) => ({ character }))
  const t = buildTeam(m)
  expect(t.funStats.칼퇴력).toBe(Math.round((c('caocao').funStats.칼퇴력 + c('liubei').funStats.칼퇴력) / 2))
  expect(t.comment).not.toMatch(/최악|안 맞|나쁜|망/)
  expect(t.comment.length).toBeGreaterThan(10)
})

test('공유 링크: 장수 id 2~6개(중복 허용), 별칭 없음, 잘못된 값은 null', () => {
  const u = new URL(teamUrl(['liubei', 'guanyu', 'guanyu']))
  expect(u.pathname).toBe('/samguk/team/r/liubei-guanyu-guanyu')
  expect(u.search).not.toMatch(/nick|name/)
  expect(parseTeam('liubei-guanyu-guanyu')!.members).toHaveLength(3)
  expect(parseTeam('liubei')).toBeNull()
  expect(parseTeam(Array(7).fill('liubei').join('-'))).toBeNull()
  expect(parseTeam('liubei-constructor')).toBeNull()
})

test('GA 결과 키(군주 id_인원)는 모든 장수에서 24자 이하', () => {
  const longest = Math.max(...samgukCharacters.map((x) => x.id.length))
  expect(longest + 2).toBeLessThanOrEqual(24)
})

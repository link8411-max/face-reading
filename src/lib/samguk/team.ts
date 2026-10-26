// 우리 팀 삼국지: 팀원 2~6명의 닮은 장수로 역할·팀의 기운·회사생활 STATUS·한줄평을 만든다. 결정적.
import type { SamgukCharacter } from '@/lib/samgukDB'

export const ROLE_ORDER = ['군주', '책사', '선봉장', '살림꾼'] as const
export type Role = (typeof ROLE_ORDER)[number] | '든든한 장수'

const ROLE_SCORE: Record<(typeof ROLE_ORDER)[number], (c: SamgukCharacter) => number> = {
  군주: (c) => c.stats.통솔 + c.stats.매력,
  책사: (c) => c.stats.지력,
  선봉장: (c) => c.stats.무력,
  살림꾼: (c) => c.stats.정치,
}

type FunKey = keyof SamgukCharacter['funStats']
const FUN_KEYS: FunKey[] = ['칼퇴력', '술자리생존', '워라밸', '재테크', '꼰대력']
const FACTION_NAME: Record<SamgukCharacter['faction'], string> = { 위: '위나라 기운', 촉: '촉나라 기운', 오: '오나라 기운', 기타: '군웅할거의 기운' }

export interface TeamMember { character: SamgukCharacter; nickname?: string; role: Role }
export interface Team { members: TeamMember[]; spirit: string; funStats: Record<FunKey, number>; comment: string }

export function buildTeam(input: { character: SamgukCharacter; nickname?: string }[]): Team {
  const roles: Role[] = input.map(() => '든든한 장수')
  const taken = new Set<number>()
  for (const role of ROLE_ORDER) {
    let best = -1
    input.forEach(({ character }, i) => {
      if (taken.has(i)) return
      if (best < 0 || ROLE_SCORE[role](character) > ROLE_SCORE[role](input[best].character)) best = i // 동점이면 먼저 올린 사람
    })
    if (best < 0) break
    roles[best] = role
    taken.add(best)
  }

  // 팀의 기운: 최다 세력. 위·촉·오가 같은 수로 최다면 천하삼분, 그 밖 동수는 먼저 올린 사람의 세력
  const count = new Map<SamgukCharacter['faction'], number>()
  for (const { character } of input) count.set(character.faction, (count.get(character.faction) ?? 0) + 1)
  const top = Math.max(...count.values())
  const leaders = [...count.entries()].filter(([, n]) => n === top).map(([f]) => f)
  const spirit = ['위', '촉', '오'].every((f) => leaders.includes(f as SamgukCharacter['faction']))
    ? '천하삼분'
    : FACTION_NAME[input.find(({ character }) => leaders.includes(character.faction))!.character.faction]

  const funStats = Object.fromEntries(FUN_KEYS.map((k) => [k, Math.round(input.reduce((s, { character }) => s + character.funStats[k], 0) / input.length)])) as Record<FunKey, number>
  return { members: input.map((m, i) => ({ ...m, role: roles[i] })), spirit, funStats, comment: commentFor(funStats, spirit) }
}

// 한줄평: 팀 평균이 가장 높은 회사생활 스탯으로 고른다 (긍정형)
const COMMENT: Record<FunKey, string> = {
  칼퇴력: '퇴근 시간만 되면 한마음으로 사라지는 칼퇴 원정대예요.',
  술자리생존: '회식 2차까지 끄떡없는 체력 만렙 팀이에요.',
  워라밸: '일도 쉼도 똑 부러지게 챙기는 균형 잡힌 팀이에요.',
  재테크: '점심시간마다 재테크 정보가 오가는 알뜰 군단이에요.',
  꼰대력: '경험 많은 선배들이 든든하게 받쳐 주는 노련한 팀이에요.',
}

function commentFor(f: Record<FunKey, number>, spirit: string): string {
  const k = FUN_KEYS.reduce((best, x) => (f[x] > f[best] ? x : best), FUN_KEYS[0])
  return `${spirit === '천하삼분' ? '천하를 셋으로 나눈 다채로운' : spirit.replace(' 기운', '').replace('의', '')} 팀! ${COMMENT[k]}`
}

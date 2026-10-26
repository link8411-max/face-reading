// "나를 지켜줄 장수": 내 회사생활 스탯의 빈틈을 가장 많이 메워 주는 같은 세력 장수 (데이터에 관계 정보가 없어 규칙으로 정한다)
import { samgukCharacters, type SamgukCharacter } from '@/lib/samgukDB'

type FunKey = keyof SamgukCharacter['funStats']
const FUN_KEYS: FunKey[] = ['칼퇴력', '술자리생존', '워라밸', '재테크', '꼰대력']

const LINE_BY_STAT: Record<FunKey, string> = {
  칼퇴력: '퇴근 시간 되면 같이 나가 줘요.',
  술자리생존: '회식 자리 끝까지 남아서 챙겨 줘요.',
  워라밸: '주말엔 같이 쉬자고 먼저 말해 줘요.',
  재테크: '월급날 재테크 상담은 맡겨 주세요.',
  꼰대력: '잔소리는 많아도 결국 다 챙겨 줘요.',
}

// 상대가 나보다 높은 회사생활 스탯 합 + 든든함(무력·통솔 평균)
function complement(me: SamgukCharacter, g: SamgukCharacter) {
  const fill = FUN_KEYS.reduce((sum, k) => sum + Math.max(0, g.funStats[k] - me.funStats[k]), 0)
  return fill + (g.stats.무력 + g.stats.통솔) / 2
}

export function guardianFor(name: string): { character: SamgukCharacter; score: number; line: string } {
  const me = samgukCharacters.find((c) => c.name === name)
  if (!me) throw new Error(`unknown character: ${name}`)
  const sameFaction = samgukCharacters.filter((c) => c.faction === me.faction && c.name !== name)
  const pool = sameFaction.length >= 2 ? sameFaction : samgukCharacters.filter((c) => c.name !== name)
  const ranked = pool
    .map((c) => ({ c, v: complement(me, c) }))
    .sort((a, b) => b.v - a.v || a.c.name.localeCompare(b.c.name))
  const { c, v } = ranked[0]
  const score = Math.max(80, Math.min(98, Math.round(80 + (v / 300) * 18)))
  const top = FUN_KEYS.reduce((best, k) => (c.funStats[k] > c.funStats[best] ? k : best), FUN_KEYS[0])
  return { character: c, score, line: `${c.traits[0]} ${c.name}. ${top} ${c.funStats[top]}, ${LINE_BY_STAT[top]}` }
}

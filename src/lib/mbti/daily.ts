// 오늘의 MBTI 운세: 날짜(한국 시간)와 유형으로 미리 써 둔 문장 풀에서 고른다 (AI 없음, 결정적).
// 같은 날 같은 유형이면 누구에게나 같은 결과, 한마디는 풀 길이(14일 이상)마다 한 번만 돈다.
import { MBTI_DAILY } from '@/content/mbtiDaily'
import { MBTI_TYPES, compatSummary, type MbtiType } from '@/lib/mbti/compat'

export interface MbtiDaily {
  headline: string
  work: string
  love: string
  relation: string
  lucky: { color: string; time: string; action: string }
  match: MbtiType
}

export { kstDate } from '@/lib/kst'

// 문자열 해시 (FNV-1a 32비트)
function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const PARTS = ['work', 'love', 'relation'] as const

function topTotal(a: MbtiType): MbtiType[] {
  return MBTI_TYPES.filter((b) => b !== a)
    .sort((x, y) => compatSummary(a, y).total - compatSummary(a, x).total || x.localeCompare(y))
    .slice(0, 3)
}

export function mbtiDaily(type: MbtiType, date: string): MbtiDaily {
  const day = Math.floor(Date.parse(date) / 86400000)
  const ti = MBTI_TYPES.indexOf(type)
  const heads = MBTI_DAILY.headlines[type]
  const [work, love, relation] = PARTS.map((part, k) => {
    // 칸마다 다른 축을 쓰고, 문장 번호에는 유형을 섞어 같은 날 같은 축 유형끼리도 겹치지 않게 한다
    const axis = (day + ti + k) % 4
    const pool = MBTI_DAILY.axis[part][type[axis] as keyof (typeof MBTI_DAILY.axis)[typeof part]]
    return pool[fnv1a(`${date}|${type}|${part}`) % pool.length]
  })
  const pick = <T,>(list: T[], salt: string) => list[fnv1a(`${date}|${type}|${salt}`) % list.length]
  return {
    headline: heads[(((day + ti) % heads.length) + heads.length) % heads.length],
    work,
    love,
    relation,
    lucky: { color: pick(MBTI_DAILY.lucky.colors, 'color'), time: pick(MBTI_DAILY.lucky.times, 'time'), action: pick(MBTI_DAILY.lucky.actions, 'action') },
    match: topTotal(type)[((day % 3) + 3) % 3],
  }
}

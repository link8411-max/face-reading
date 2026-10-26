// MBTI 궁합 계산 (재미로 보는 궁합)
// 네 축(E/I, S/N, T/F, J/P)이 같은지 다른지에 따라 맥락별 가중치를 더하고 뺀다. 결정적이고 대칭이다.
// 통설: 연애는 세상을 보는 방식(S/N)이 같고 판단 방식(T/F)이 다르면 서로 보완된다.
//       친구는 에너지 방향(E/I)과 관심사(S/N)가 같을수록 편하다.
//       직장은 일하는 방식(J/P)이 같고 판단 방식(T/F)이 다르면 손발이 잘 맞는다.

export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const
export type MbtiType = (typeof MBTI_TYPES)[number]
export type Context = 'love' | 'friend' | 'work'

export function isMbti(s: string): s is MbtiType {
  return (MBTI_TYPES as readonly string[]).includes(s)
}

const BASE = 70
// [E/I, S/N, T/F, J/P] 축별 가감: same = 같을 때, diff = 다를 때
const WEIGHTS: Record<Context, { same: number[]; diff: number[] }> = {
  love: { same: [2, 12, -5, -3], diff: [3, -10, 10, 4] },
  friend: { same: [10, 10, 3, 2], diff: [-3, -9, 3, 0] },
  work: { same: [0, -2, -4, 10], diff: [3, 4, 8, -6] },
}

function raw(a: MbtiType, b: MbtiType, ctx: Context): number {
  const w = WEIGHTS[ctx]
  let score = BASE
  for (let i = 0; i < 4; i++) score += a[i] === b[i] ? w.same[i] : w.diff[i]
  return score
}

// 점수는 55~100으로 펼친다. 가장 잘 맞는 조합이 정확히 100점이 되게 해서 결과를 공유하고 싶게 만든다.
const MIN_SCORE = 55
const MAX_SCORE = 100
const pairs = MBTI_TYPES.flatMap((a) => MBTI_TYPES.map((b) => [a, b] as const))
const range = (values: number[]) => ({ min: Math.min(...values), max: Math.max(...values) })
const CTX_RANGE: Record<Context, { min: number; max: number }> = {
  love: range(pairs.map(([a, b]) => raw(a, b, 'love'))),
  friend: range(pairs.map(([a, b]) => raw(a, b, 'friend'))),
  work: range(pairs.map(([a, b]) => raw(a, b, 'work'))),
}
const totalRaw = (a: MbtiType, b: MbtiType) => raw(a, b, 'love') + raw(a, b, 'friend') + raw(a, b, 'work')
const TOTAL_RANGE = range(pairs.map(([a, b]) => totalRaw(a, b)))
const stretch = (v: number, r: { min: number; max: number }) =>
  Math.round(MIN_SCORE + ((v - r.min) / (r.max - r.min)) * (MAX_SCORE - MIN_SCORE))

export function compatScore(a: MbtiType, b: MbtiType, ctx: Context): number {
  return stretch(raw(a, b, ctx), CTX_RANGE[ctx])
}

const LINES: { same: Record<string, string>; diff: string }[] = [
  {
    same: { E: '둘 다 밖에서 에너지를 얻어 함께 있으면 활기가 넘쳐요.', I: '둘 다 조용한 시간을 소중히 여겨 서로의 공간을 잘 지켜 줘요.' },
    diff: '한 사람은 밖에서, 한 사람은 안에서 에너지를 얻어 서로의 세계를 넓혀 줘요.',
  },
  {
    same: { S: '현실 감각이 비슷해 일상을 함께 꾸리기 편해요.', N: '상상과 가능성을 이야기할 때 대화가 끝없이 이어져요.' },
    diff: '현실 감각과 상상력이 만나 서로 못 보던 면을 보여 줘요.',
  },
  {
    same: { T: '둘 다 논리적으로 이야기해서 오해가 적어요.', F: '서로의 마음을 세심하게 알아주는 따뜻한 사이예요.' },
    diff: '이성과 감성이 서로를 보완해 균형 잡힌 결정을 내려요.',
  },
  {
    same: { J: '계획을 세우고 지키는 방식이 같아 손발이 잘 맞아요.', P: '즉흥적인 즐거움을 함께 누릴 줄 아는 사이예요.' },
    diff: '한 사람의 계획력과 한 사람의 유연함이 만나 일이 매끄럽게 풀려요.',
  },
]

function label(total: number): string {
  if (total >= 95) return '천생연분'
  if (total >= 85) return '찰떡궁합'
  if (total >= 75) return '좋은 짝'
  if (total >= 65) return '서로 배우는 사이'
  return '노력하면 빛나는 사이'
}

export function compatSummary(a: MbtiType, b: MbtiType) {
  const love = compatScore(a, b, 'love')
  const friend = compatScore(a, b, 'friend')
  const work = compatScore(a, b, 'work')
  const total = stretch(totalRaw(a, b), TOTAL_RANGE)
  const lines = LINES.map((l, i) => (a[i] === b[i] ? l.same[a[i]] : l.diff))
  return { love, friend, work, total, label: label(total), lines }
}

export function bestMatches(a: MbtiType, ctx: Context, n = 3): MbtiType[] {
  return MBTI_TYPES.filter((b) => b !== a)
    .map((b) => ({ b, s: compatScore(a, b, ctx) }))
    .sort((x, y) => y.s - x.s || x.b.localeCompare(y.b))
    .slice(0, n)
    .map((x) => x.b)
}

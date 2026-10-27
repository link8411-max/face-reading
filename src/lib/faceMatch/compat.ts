// 얼굴 궁합: 두 얼굴의 동물상 결과와 관계(친구·연인·짝사랑)로 점수를 낸다. 대칭·결정적.
// 한 폰에서 두 장을 올리든 초대 링크로 하든 같은 동물상·관계면 같은 점수가 나온다(링크에는 유형만 담기므로).
// 기준: animalTypeDB의 잘 맞는 동물상(best)·맞춰 가면 좋은 동물상(worst). 관계마다 55~100으로 넓혀 최고 쌍이 100점이 되게 한다.
import { ANIMAL_KEYS, type AnimalKey } from '@/lib/animal/matcher'
import { animalTypeDB } from '@/lib/animalTypeDB'

export const REL = ['friend', 'lover', 'crush'] as const
export type Rel = (typeof REL)[number]
export const REL_NAME: Record<Rel, string> = { friend: '친구', lover: '연인', crush: '짝사랑' }

// 관계별 가중치: 잘 맞는 쪽(best)이면 더하고, 맞춰 가는 쪽(worst)이면 빼고, 같은 동물상이면 관계에 따라 다르게
// neutral: 어느 쪽에도 해당하지 않는 쌍. 친구는 무난한 사이도 잘 지내고, 짝사랑은 끌림이 있어야 높다.
const W: Record<Rel, { best: number; worst: number; same: number; neutral: number }> = {
  friend: { best: 10, worst: -2, same: 22, neutral: 6 },
  lover: { best: 18, worst: -8, same: 4, neutral: 0 },
  crush: { best: 16, worst: -6, same: 8, neutral: -3 },
}

const keyOf = (name: string) => ANIMAL_KEYS.find((k) => animalTypeDB[k].name === name)
const bestOf = (k: AnimalKey) => animalTypeDB[k].compatibility.best.map(keyOf)
const worstOf = (k: AnimalKey) => animalTypeDB[k].compatibility.worst.map(keyOf)

// 동점을 줄이고 관계마다 결이 다르게 보이도록 쌍·관계별 작은 차이(0~5, 대칭)
function jitter(a: AnimalKey, b: AnimalKey, rel: Rel): number {
  const [x, y] = [ANIMAL_KEYS.indexOf(a), ANIMAL_KEYS.indexOf(b)].sort((m, n) => m - n)
  const r = REL.indexOf(rel) + 1
  return (x * 7 + y * 13 + x * y + r * (x + 3 * y + 5)) % 6
}

function raw(a: AnimalKey, b: AnimalKey, rel: Rel): number {
  const w = W[rel]
  let s = 70 + jitter(a, b, rel)
  if (a === b) return s + w.same
  let hit = false
  for (const [p, q] of [[a, b], [b, a]] as const) {
    if (bestOf(p).includes(q)) { s += w.best; hit = true }
    if (worstOf(p).includes(q)) { s += w.worst; hit = true }
  }
  return hit ? s : s + w.neutral
}

const RANGE = Object.fromEntries(REL.map((rel) => {
  const v = ANIMAL_KEYS.flatMap((a) => ANIMAL_KEYS.map((b) => raw(a, b, rel)))
  return [rel, { min: Math.min(...v), max: Math.max(...v) }]
})) as Record<Rel, { min: number; max: number }>

export function score(a: AnimalKey, b: AnimalKey, rel: Rel): number {
  const { min, max } = RANGE[rel]
  return Math.round(55 + ((raw(a, b, rel) - min) / (max - min)) * 45)
}

function label(s: number, rel: Rel): string {
  if (rel === 'crush') return s >= 95 ? '운명 같은 인연' : s >= 85 ? '고백해도 좋은 사이' : s >= 75 ? '천천히 다가가면 좋은 사이' : s >= 65 ? '조금 더 알아 가는 사이' : '시간이 편이 되어 줄 사이'
  return s >= 95 ? '천생연분' : s >= 85 ? '찰떡궁합' : s >= 75 ? '좋은 짝' : s >= 65 ? '서로 배우는 사이' : '노력하면 빛나는 사이'
}

const josa = (w: string, withB: string, without: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00
  return w + (c >= 0 && c <= 11171 && c % 28 !== 0 ? withB : without)
}

const CLOSING: Record<Rel, [string, string, string]> = {
  friend: ['같이 있으면 대화가 끊이지 않는 사이예요.', '서로가 서로에게 든든한 버팀목이 돼요.', '천천히 알아 갈수록 더 편해지는 사이예요.'],
  lover: ['서로를 있는 그대로 아껴 주는 따뜻한 사이예요.', '서로의 매력에 자꾸 끌려 설렘이 오래가요.', '조금씩 맞춰 갈수록 단단해지는 사이예요.'],
  crush: ['마음을 전하면 반가운 대답이 돌아올 기운이에요.', '자연스럽게 가까워질 기회가 곧 찾아와요.', '꾸준한 관심이 마음을 여는 열쇠가 돼요.'],
}

export interface FaceMatchResult { score: number; label: string; headline: string; lines: [string, string]; others: { rel: Rel; score: number }[] }

export function faceMatch(a: AnimalKey, b: AnimalKey, rel: Rel): FaceMatchResult {
  const s = score(a, b, rel)
  const A = animalTypeDB[a], B = animalTypeDB[b]
  const first = a === b
    ? `둘 다 ${josa(A.name, '이라', '라')} ${A.personality.positive[0]}에서 금방 통해요.`
    : `${A.name}의 ${josa(A.personality.positive[0], '과', '와')} ${B.name}의 ${josa(B.personality.positive[0], '이', '가')} 만나 서로를 채워 줘요.`
  const tier = s >= 85 ? 0 : s >= 70 ? 1 : 2
  return {
    score: s,
    label: label(s, rel),
    headline: rel === 'crush' ? `짝사랑 성공 가능성 ${s}%` : `${REL_NAME[rel]} 궁합 ${s}점`,
    lines: [first, CLOSING[rel][tier]],
    others: REL.filter((r) => r !== rel).map((r) => ({ rel: r, score: score(a, b, r) })),
  }
}

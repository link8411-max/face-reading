import { 천간, 지지, 오행, 천간오행 } from '@/lib/saju'

export type 천간관계 = '합' | '충' | '인성' | '비겁' | '재성' | '식상' | '관살'
export type 지지관계 = '육합' | '삼합' | '무관' | '복음' | '형' | '충'
export type 오행관계 = '인성' | '비겁' | '재성' | '식상' | '관살'

export const 천간관계목록: readonly 천간관계[] = ['합', '충', '인성', '비겁', '재성', '식상', '관살']
export const 지지관계목록: readonly 지지관계[] = ['육합', '삼합', '무관', '복음', '형', '충']

export const 육십갑자: readonly { 천간: string; 지지: string }[] = Array.from({ length: 60 }, (_, i) => ({
  천간: 천간[i % 10],
  지지: 지지[i % 12],
}))

const 천간점수: Record<천간관계, number> = { 합: 1.5, 충: -1.5, 인성: 1.0, 비겁: 0.5, 재성: 0.5, 식상: 0, 관살: -1.0 }
const 지지점수: Record<지지관계, number> = { 육합: 2.0, 삼합: 1.5, 무관: 0, 복음: -0.5, 형: -1.5, 충: -2.0 }

const 생순환 = ['목', '화', '토', '금', '수']
const 극순환 = ['목', '토', '수', '화', '금']

function 다음(순환: string[], 오행: string): string {
  return 순환[(순환.indexOf(오행) + 1) % 순환.length]
}

export function 오행관계판정(내오행: string, 상대오행: string): { 관계: 오행관계; 점수: number } {
  if (!(오행 as readonly string[]).includes(내오행)) throw new Error(`모르는 오행: ${내오행}`)
  if (!(오행 as readonly string[]).includes(상대오행)) throw new Error(`모르는 오행: ${상대오행}`)
  let 관계: 오행관계
  if (내오행 === 상대오행) 관계 = '비겁'
  else if (다음(생순환, 상대오행) === 내오행) 관계 = '인성'
  else if (다음(생순환, 내오행) === 상대오행) 관계 = '식상'
  else if (다음(극순환, 내오행) === 상대오행) 관계 = '재성'
  else 관계 = '관살'
  return { 관계, 점수: 천간점수[관계] }
}

const 쌍 = (목록: string[]) => new Set(목록.flatMap((s) => [s, [...s].reverse().join('')]))

const 천간합 = 쌍(['갑기', '을경', '병신', '정임', '무계'])
const 천간충 = 쌍(['갑경', '을신', '병임', '정계'])

export function 천간관계판정(내천간: string, 일간: string): { 관계: 천간관계; 점수: number } {
  for (const x of [내천간, 일간]) {
    if (!(천간 as readonly string[]).includes(x)) throw new Error(`모르는 천간: ${x}`)
  }
  const key = 내천간 + 일간
  if (천간합.has(key)) return { 관계: '합', 점수: 천간점수.합 }
  if (천간충.has(key)) return { 관계: '충', 점수: 천간점수.충 }
  return 오행관계판정(천간오행[내천간], 천간오행[일간])
}

const 지지충 = 쌍(['자오', '축미', '인신', '묘유', '진술', '사해'])
const 지지육합 = 쌍(['자축', '인해', '묘술', '진유', '사신', '오미'])
const 삼합그룹 = ['인오술', '신자진', '사유축', '해묘미']
const 지지삼합 = new Set(
  삼합그룹.flatMap((g) => [...g].flatMap((a) => [...g].filter((b) => a !== b).map((b) => a + b))),
)
// 형: 인사신 서로, 축술미 서로, 자묘 (충과 겹치는 인신·축미는 충이 우선)
const 지지형 = new Set([
  ...쌍(['인사', '사신', '인신', '축술', '술미', '축미', '자묘']),
  '진진', '오오', '유유', '해해',
])

export function 지지관계판정(내지지: string, 일지: string): { 관계: 지지관계; 점수: number } {
  for (const x of [내지지, 일지]) {
    if (!(지지 as readonly string[]).includes(x)) throw new Error(`모르는 지지: ${x}`)
  }
  const key = 내지지 + 일지
  let 관계: 지지관계
  if (지지충.has(key)) 관계 = '충'
  else if (지지형.has(key)) 관계 = '형'
  else if (지지육합.has(key)) 관계 = '육합'
  else if (지지삼합.has(key)) 관계 = '삼합'
  else if (내지지 === 일지) 관계 = '복음'
  else 관계 = '무관'
  return { 관계, 점수: 지지점수[관계] }
}

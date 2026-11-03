// 열전 허브의 카드 목록 필터·오늘의 인물 계산. 열전 본문을 import하지 않는 순수 함수라 클라이언트 번들에 넣어도 가볍다.
export type HubFaction = '위' | '촉' | '오' | '기타'
export type HubFilter = 'all' | HubFaction

export interface HubCard {
  id: string
  name: string
  style: string | null // 자(字)
  faction: HubFaction
  portrait: string | null // 초상화 경로, 대기 인물이면 null
  line: string // summary의 첫 문장
  fact: string // funFacts[0]
}

export const FIRST_PAGE = 12

export const FILTER_LABEL: Record<HubFilter, string> = { all: '전체', 위: '위', 촉: '촉', 오: '오', 기타: '군웅' }

// 검색어 비교용: 공백 제거 + 소문자
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()

// 이름 일부나 자(字) 일부가 들어 있으면 맞는 것으로 본다
export function matchesQuery(card: Pick<HubCard, 'name' | 'style'>, query: string): boolean {
  const q = norm(query)
  if (!q) return true
  return norm(card.name).includes(q) || (card.style ? norm(card.style).includes(q) : false)
}

// 지금 화면에 보일 카드 id. 검색어가 있으면 고른 세력과 상관없이 전체 127명에서 일치하는 모두(선택한 세력은 그대로 기억만 한다),
// 없으면 세력 안에서 처음엔 12명 + 더 보기로 나머지.
export function visibleIds(cards: HubCard[], opts: { filter: HubFilter; query: string; expanded: boolean }): string[] {
  const searching = opts.query.trim() !== ''
  if (searching) return cards.filter((c) => matchesQuery(c, opts.query)).map((c) => c.id)
  const inFaction = cards.filter((c) => opts.filter === 'all' || c.faction === opts.filter)
  return (opts.expanded ? inFaction : inFaction.slice(0, FIRST_PAGE)).map((c) => c.id)
}

// 지금 조건에 맞는 전체 수(더 보기 버튼·검색 결과 수에 쓴다). 검색 중이면 세력과 무관하게 전체에서 센다
export function matchedCount(cards: HubCard[], opts: { filter: HubFilter; query: string }): number {
  if (opts.query.trim() !== '') return cards.filter((c) => matchesQuery(c, opts.query)).length
  return cards.filter((c) => opts.filter === 'all' || c.faction === opts.filter).length
}

// 글자 두 개씩 묶은 조각(공백·문장부호 제외). 문장 사이 겹침을 재는 데 쓴다
function bigrams(s: string): Set<string> {
  const chars = [...s.replace(/[^\p{L}\p{N}]/gu, '')]
  const out = new Set<string>()
  for (let i = 0; i + 1 < chars.length; i++) out.add(chars[i] + chars[i + 1])
  return out
}

// 알고 보면 한 줄: 첫 문장과 글자 조각이 가장 덜 겹치는 것(겹침 비율이 같으면 앞 번호). 같은 말을 두 번 보이지 않으려는 것이다
export function pickFact(line: string, facts: string[]): string {
  if (facts.length === 0) return ''
  const base = bigrams(line)
  let best = 0
  let bestScore = Infinity
  facts.forEach((f, i) => {
    const g = bigrams(f)
    let shared = 0
    for (const b of g) if (base.has(b)) shared++
    const score = g.size === 0 ? 0 : shared / g.size
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return facts[best]
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

// 오늘의 인물: 한국 날짜(YYYY-MM-DD)로 결정. 하루에 한 칸씩 건너뛰어(n과 서로소인 보폭) n일 동안 같은 사람이 겹치지 않는다.
export function todayIndex(date: string, n: number): number {
  if (n <= 0) return 0
  const [y, m, d] = date.split('-').map(Number)
  const day = Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000)
  let stride = 37
  while (gcd(stride, n) !== 1) stride += 2
  return (((day * stride) % n) + n) % n
}

export function todayCard(cards: HubCard[], date: string): HubCard | null {
  if (cards.length === 0) return null
  // 카드 순서(인기순)와 상관없이 id 순으로 고정해, 목록 순서를 바꿔도 날짜별 인물이 유지되게 한다
  const sorted = [...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return sorted[todayIndex(date, sorted.length)]
}

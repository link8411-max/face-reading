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

// 지금 화면에 보일 카드 id. 검색어가 있으면 세력 안의 모든 일치 결과, 없으면 처음엔 12명 + 더 보기로 나머지.
export function visibleIds(cards: HubCard[], opts: { filter: HubFilter; query: string; expanded: boolean }): string[] {
  const inFaction = cards.filter((c) => opts.filter === 'all' || c.faction === opts.filter)
  const matched = inFaction.filter((c) => matchesQuery(c, opts.query))
  const searching = opts.query.trim() !== ''
  const shown = searching || opts.expanded ? matched : matched.slice(0, FIRST_PAGE)
  return shown.map((c) => c.id)
}

// 필터·검색 조건에 맞는 전체 수(더 보기 버튼에 쓴다)
export function matchedCount(cards: HubCard[], opts: { filter: HubFilter; query: string }): number {
  return cards.filter((c) => (opts.filter === 'all' || c.faction === opts.filter) && matchesQuery(c, opts.query)).length
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

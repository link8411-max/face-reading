// 장수 월드컵 판 구성. 클라이언트에서도 쓰므로 열전 본문은 가져오지 않는다.
import { samgukCharacters } from '@/lib/samgukDB'
import type { Rng } from '@/lib/duel/rng'

export type BoardKey = 'warrior' | 'strategist' | 'women' | 'random'

export const BOARD_KEYS: BoardKey[] = ['warrior', 'strategist', 'women', 'random']

export function isBoardKey(x: unknown): x is BoardKey {
  return typeof x === 'string' && (BOARD_KEYS as string[]).includes(x)
}

export const BOARDS: Record<BoardKey, { title: string; blurb: string; basis: string | null }> = {
  warrior: { title: '최강 무장', blurb: '무력 상위 16명', basis: '코에이 스타일 무력 기준' },
  strategist: { title: '최고 책사', blurb: '지력 상위 16명', basis: '코에이 스타일 지력 기준' },
  women: { title: '삼국지 여인', blurb: '초상화가 있는 여성 인물', basis: null },
  random: { title: '전체 무작위', blurb: '초상화 있는 장수 중 무작위 16명', basis: null },
}

const TOP = 16
// 책사가 아닌 의원은 책사 판에서 뺀다.
const STRATEGIST_EXCLUDED = new Set(['huatuo'])

type Stats = (typeof samgukCharacters)[number]['stats']

function topBy(primary: keyof Stats, secondary: keyof Stats, excluded: Set<string>): string[] {
  return samgukCharacters
    .filter((c) => !excluded.has(c.id))
    .slice()
    .sort((a, b) => b.stats[primary] - a.stats[primary] || b.stats[secondary] - a.stats[secondary] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, TOP)
    .map((c) => c.id)
}

export function boardPool(board: BoardKey): string[] {
  switch (board) {
    case 'warrior':
      return topBy('무력', '통솔', new Set())
    case 'strategist':
      return topBy('지력', '정치', STRATEGIST_EXCLUDED)
    case 'women':
      return samgukCharacters.filter((c) => c.gender === '여').map((c) => c.id)
    case 'random':
      return samgukCharacters.map((c) => c.id)
  }
}

export function bracketSize(poolSize: number): 16 | 8 | null {
  if (poolSize >= 16) return 16
  if (poolSize >= 8) return 8
  return null
}

function shuffle<T>(arr: T[], rand: Rng): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 후보에서 대진 크기만큼 뽑아 섞는다. withId가 후보에 있으면 반드시 포함. 후보가 8명 미만이면 빈 배열 */
export function drawFromPool(pool: string[], rand: Rng, withId?: string | null): string[] {
  const unique = Array.from(new Set(pool))
  const size = bracketSize(unique.length)
  if (size === null) return []
  const picked = shuffle(unique, rand).slice(0, size)
  if (withId && unique.includes(withId) && !picked.includes(withId)) {
    picked[picked.length - 1] = withId
  }
  return shuffle(picked, rand)
}

export function drawEntrants(board: BoardKey, rand: Rng, withId?: string | null): string[] {
  return drawFromPool(boardPool(board), rand, withId)
}

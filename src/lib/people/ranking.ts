// 응원 순위 가공. 열전이 있는 인물만 남기고, 응원이 하나도 없으면 순위 대신 준비 중으로 본다.
import { getPerson } from '@/content/samgukPeople'

export interface RankRow {
  id: string
  n: number
  rank: number
}

// 많은 순, 동점은 같은 순위(1, 1, 3). 응원 합이 threshold(기본 1) 미만이면 ready false.
export function rankingView(rows: { id: string; n: number }[], threshold = 1): { ready: boolean; rows: RankRow[] } {
  const own = rows.filter((r) => getPerson(r.id) !== undefined && Number.isFinite(r.n) && r.n > 0)
  const sorted = [...own].sort((a, b) => b.n - a.n || a.id.localeCompare(b.id))
  const ranked: RankRow[] = []
  sorted.forEach((r, i) => {
    const rank = i > 0 && sorted[i - 1].n === r.n ? ranked[i - 1].rank : i + 1
    ranked.push({ id: r.id, n: r.n, rank })
  })
  const total = sorted.reduce((s, r) => s + r.n, 0)
  return { ready: total >= threshold, rows: ranked }
}

/** 한 인물의 응원 순위(동점은 같은 순위). 열전 인물만 세고, 응원이 1번 이상인 인물만 순위가 있다. 없으면 null */
export function rankOf(rows: { id: string; n: number }[], id: string): number | null {
  const view = rankingView(rows)
  return view.rows.find((r) => r.id === id)?.rank ?? null
}

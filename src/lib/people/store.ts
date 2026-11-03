// 인물열전 응원·투표 저장소(Supabase PostgREST). 일기토 API와 같은 방식: 서비스 키, 5초 제한, 키·본문은 로그에 남기지 않는다.
import { getPerson } from '@/content/samgukPeople'
import { rankOf } from './ranking'
import { pairKey, type PersonStats, type VoteKind } from './votes'

export interface StoreConfig {
  url: string
  key: string
}

export function storeConfig(): StoreConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_KEY
  return url && key ? { url, key } : null
}

const headers = (cfg: StoreConfig, prefer?: string): Record<string, string> => ({
  apikey: cfg.key,
  Authorization: `Bearer ${cfg.key}`,
  'Content-Type': 'application/json',
  ...(prefer ? { Prefer: prefer } : {}),
})

export interface VoteRow {
  kind: VoteKind
  target: string
  option: string
  voter_hash: string
  day: string
}

/** 응원은 하루 1회(이미 있으면 무시 → counted false), 나머지는 다시 누르면 선택을 바꾼다. 실패하면 throw */
export async function insertVote(cfg: StoreConfig, row: VoteRow): Promise<{ counted: boolean }> {
  const cheer = row.kind === 'cheer'
  const res = await fetch(`${cfg.url}/rest/v1/people_votes?on_conflict=kind,target,voter_hash,day`, {
    method: 'POST',
    headers: headers(
      cfg,
      cheer ? 'resolution=ignore-duplicates,return=representation' : 'resolution=merge-duplicates,return=representation',
    ),
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`insert ${res.status}`)
  if (!cheer) return { counted: true }
  const rows: unknown = await res.json()
  return { counted: Array.isArray(rows) && rows.length > 0 }
}

async function rpc(cfg: StoreConfig, name: string, args: Record<string, string>): Promise<unknown> {
  const res = await fetch(`${cfg.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`rpc ${res.status}`)
  return res.json()
}

/** 한 인물의 집계. 대결은 그 인물과 라이벌의 쌍만 센다. 실패하면 throw */
export async function readStats(cfg: StoreConfig, id: string): Promise<PersonStats> {
  const person = getPerson(id)
  const pair = person ? pairKey(id, person.rivalId) : ''
  const rows = await rpc(cfg, 'people_stats', { p_id: id, p_pair: pair })
  const stats: PersonStats = { cheer: 0, duel: {}, scene: {}, verdict: {} }
  if (!Array.isArray(rows)) return stats
  for (const r of rows as { kind?: unknown; option?: unknown; n?: unknown }[]) {
    const n = Number(r.n)
    if (typeof r.option !== 'string' || !Number.isFinite(n)) continue
    if (r.kind === 'cheer') stats.cheer += n
    else if (r.kind === 'duel' || r.kind === 'scene' || r.kind === 'verdict') stats[r.kind][r.option] = n
  }
  return stats
}

/** 응원 수 순위(많은 순). 실패하면 throw */
export async function readCheerRanking(cfg: StoreConfig): Promise<{ id: string; n: number }[]> {
  const rows = await rpc(cfg, 'people_cheer_ranking', {})
  if (!Array.isArray(rows)) return []
  return (rows as { target?: unknown; n?: unknown }[])
    .filter((r) => typeof r.target === 'string' && Number.isFinite(Number(r.n)))
    .map((r) => ({ id: r.target as string, n: Number(r.n) }))
}

/** 집계 + 응원 순위. 순위를 못 읽어도 집계는 돌려준다(rank 없음). 집계를 못 읽으면 throw */
export async function readStatsWithRank(cfg: StoreConfig, id: string): Promise<PersonStats> {
  const [stats, rows] = await Promise.all([readStats(cfg, id), readCheerRanking(cfg).catch(() => null)])
  if (rows && stats.cheer > 0) {
    const rank = rankOf(rows, id)
    if (rank !== null) stats.rank = rank
  }
  return stats
}

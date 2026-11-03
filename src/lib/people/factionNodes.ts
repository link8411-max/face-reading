// 세력 그림에 그릴 인물 고르기: 같은 세력 안(열전 있는 사람)과 이어진 관계 수가 많은 순, 동점은 전체 관계 수, 그다음 원래 순서.
// 그려진 노드끼리 선으로 이어지도록 하려는 것이다. 결과는 원래 순서로 돌려준다.
import { relationsOf } from './relations'

export const MAX_MAP_NODES = 12

export function pickMapNodes(ids: string[], max = MAX_MAP_NODES): string[] {
  const inFaction = new Set(ids)
  return ids
    .map((id, order) => {
      const rels = relationsOf(id)
      const linked = new Set(rels.filter((r) => r.otherId && r.otherId !== id && inFaction.has(r.otherId)).map((r) => r.otherId))
      return { id, order, linked: linked.size, total: rels.length }
    })
    .sort((a, b) => b.linked - a.linked || b.total - a.total || a.order - b.order)
    .slice(0, max)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id)
}

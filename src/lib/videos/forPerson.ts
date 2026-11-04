import { relationsOf, type RelationView } from '@/lib/people/relations'
import { portraitSrc } from '@/lib/people/portrait'
import { characterById } from '@/lib/people/characters'
import type { Video } from './types'

export type RelatedVideo = { video: Video; personId: string; personName: string; label: string }
export type SgTile = {
  id: string | null
  name: string
  label: string
  portrait: string | null
  href: string | null
  hasVideo: boolean
}
export type SgKey = '혈연' | '의형제' | '군신' | '동료' | '라이벌' | '원수'
export type SgGroup = { key: SgKey; tiles: SgTile[] }

const GROUP_ORDER: SgKey[] = ['혈연', '의형제', '군신', '동료', '라이벌', '원수']
const RELATED_MAX = 6
const t = (v: Video) => Date.parse(v.publishedAt)

export function videosForPerson(videos: Video[], id: string): { own: Video[]; related: RelatedVideo[] } {
  const own = videos
    .filter((v) => v.people.includes(id))
    .sort((a, b) => Number(b.people[0] === id) - Number(a.people[0] === id) || t(b) - t(a))
  const used = new Set(own.map((v) => v.id))
  const related: RelatedVideo[] = []
  for (const r of relationsOf(id)) {
    if (!r.otherId || !r.hasPage) continue
    const label = r.label
    for (const v of videos.filter((x) => x.people.includes(r.otherId!)).sort((a, b) => t(b) - t(a))) {
      if (used.has(v.id)) continue
      if (related.length >= RELATED_MAX) return { own, related }
      used.add(v.id)
      related.push({ video: v, personId: r.otherId, personName: r.otherName, label })
    }
  }
  return { own, related }
}

function tileOf(r: RelationView, videos: Video[]): SgTile {
  const otherId = r.otherId
  return {
    id: otherId,
    name: r.otherName,
    label: r.label,
    portrait: otherId && characterById(otherId) ? portraitSrc(otherId) : null,
    href: r.hasPage && otherId ? `/samguk/people/${otherId}` : null,
    hasVideo: otherId !== null && videos.some((v) => v.people.includes(otherId)),
  }
}

export function sanggwando(id: string, videos: Video[]): SgGroup[] {
  const buckets = new Map<SgKey, SgTile[]>()
  for (const r of relationsOf(id)) {
    const key = (r.kin ? '혈연' : r.type) as SgKey
    const list = buckets.get(key) ?? []
    list.push(tileOf(r, videos))
    buckets.set(key, list)
  }
  return GROUP_ORDER.filter((k) => buckets.has(k)).map((key) => ({ key, tiles: buckets.get(key)! }))
}

export function relatedFaces(id: string, n = 5): SgTile[] {
  return relationsOf(id)
    .map((r) => tileOf(r, []))
    .filter((x) => x.portrait && x.href)
    .slice(0, n)
}

import type { Video } from './types'
import { thumbUrl } from './format'

function isoDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`
}

export function videoObjectJsonLd(v: Video): Record<string, unknown> {
  const o: Record<string, unknown> = {
    '@type': 'VideoObject',
    name: v.title,
    description: v.description || v.title,
    thumbnailUrl: v.thumbnail || thumbUrl(v.id),
    uploadDate: v.publishedAt,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
    contentUrl: `https://www.youtube.com/shorts/${v.id}`,
  }
  if (v.durationSec !== null) o.duration = isoDuration(v.durationSec)
  if (v.views !== null) {
    o.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: v.views,
    }
  }
  return o
}

export function itemListJsonLd(vs: Video[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: vs.map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: videoObjectJsonLd(v) })),
  }
}

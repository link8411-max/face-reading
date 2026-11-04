export type Video = {
  id: string
  title: string
  description: string
  publishedAt: string
  durationSec: number | null
  views: number | null
  thumbnail: string
  people: string[]
  isShort: boolean
  event: string | null
}

export type VideoSlot = 'people' | 'result' | 'videos' | 'hub'

export type VideoOverride = { people?: string[]; hide?: boolean; event?: string }

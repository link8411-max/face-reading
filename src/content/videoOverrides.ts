import type { VideoOverride } from '@/lib/videos/types'

// 영상 id별 보정. 해시태그로 읽은 값보다 우선한다.
// 예: 'R-lrShfZU7s': { people: ['xiaohoudun'] }, 'xxxxxxxxxxx': { hide: true }
export const VIDEO_OVERRIDES: Record<string, VideoOverride> = {}

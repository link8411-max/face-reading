'use client'

import { useNow } from './useNow'
import { videoBadge } from '@/lib/videos/format'
import type { Video } from '@/lib/videos/types'

/** 마운트 뒤에만 그린다(하이드레이션 안전). 24시간 안이면 NEW, 그 뒤엔 조회수. */
export default function VideoBadgeText({ video, className, newClassName }: { video: Video; className?: string; newClassName?: string }) {
  const now = useNow()
  if (now === null) return null
  const b = videoBadge(video, now.getTime())
  if (!b) return null
  return b.kind === 'new'
    ? <span className={newClassName ?? className}>NEW</span>
    : <span className={className}>{b.text}</span>
}

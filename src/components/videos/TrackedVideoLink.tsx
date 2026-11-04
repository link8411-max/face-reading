'use client'

import type { ReactNode } from 'react'
import { track } from '@/lib/analytics'
import { gaVideoId } from '@/lib/videos/format'
import type { VideoSlot } from '@/lib/videos/types'

export default function TrackedVideoLink({
  id, slot, href, className, children,
}: { id: string; slot: VideoSlot; href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} className={className} onClick={() => track('video_play', { slot, result_id: gaVideoId(id) })}>
      {children}
    </a>
  )
}
